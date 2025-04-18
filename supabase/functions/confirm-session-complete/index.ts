
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';
import Stripe from 'https://esm.sh/stripe@12.13.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const { sessionId, userRole } = await req.json();
    
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Session ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get session data
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('*, student:student_id(*), tutor:tutor_id(*), payment:payment_transactions!inner(*)')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user is authorized to confirm this session
    if (userRole === 'tutor' && session.tutor_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized to confirm this session' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (userRole === 'student' && session.student_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized to confirm this session' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update the appropriate confirmation field
    const updateData = userRole === 'tutor' 
      ? { tutor_confirmed: true } 
      : { student_confirmed: true };
    
    // Update session record
    const { error: updateError } = await supabaseAdmin
      .from('sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (updateError) {
      return new Response(JSON.stringify({ error: 'Failed to update session' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if both parties have confirmed
    const { data: updatedSession } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    // If both have confirmed, mark session as complete and transfer payment
    if (updatedSession?.tutor_confirmed && updatedSession?.student_confirmed) {
      // Get the payment transaction
      const { data: payment } = await supabaseAdmin
        .from('payment_transactions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (payment && payment.payment_intent_id && !payment.transfer_id) {
        try {
          // Initialize Stripe
          const stripe = new Stripe(Deno.env.get('STRIPE_CONNECT_SECRET_KEY') || '', {
            apiVersion: '2023-10-16',
          });

          // Get the tutor's connect account id
          const { data: tutorProfile } = await supabaseAdmin
            .from('profiles')
            .select('stripe_connect_id')
            .eq('id', session.tutor_id)
            .single();

          if (!tutorProfile?.stripe_connect_id) {
            throw new Error('Tutor does not have a Stripe Connect account');
          }

          // Calculate the platform fee (e.g., 15%)
          const amount = payment.amount;
          const platformFeePercent = 0.15;
          const platformFee = Math.round(amount * platformFeePercent);
          const tutorAmount = amount - platformFee;

          // Create a transfer to the tutor's connect account
          const transfer = await stripe.transfers.create({
            amount: tutorAmount,
            currency: 'usd',
            destination: tutorProfile.stripe_connect_id,
            transfer_group: `session_${sessionId}`,
            source_transaction: payment.charge_id,
            metadata: {
              session_id: sessionId,
              tutor_id: session.tutor_id,
              student_id: session.student_id,
            },
          });

          // Update the payment transaction with transfer info
          await supabaseAdmin
            .from('payment_transactions')
            .update({
              transfer_id: transfer.id,
              transfer_status: 'completed',
              platform_fee: platformFee,
              updated_at: new Date().toISOString(),
            })
            .eq('id', payment.id);

          // Create a record in payment_transfers
          await supabaseAdmin
            .from('payment_transfers')
            .insert({
              payment_id: payment.id,
              session_id: sessionId,
              tutor_id: session.tutor_id,
              student_id: session.student_id,
              amount: tutorAmount,
              platform_fee: platformFee,
              transfer_id: transfer.id,
              status: 'completed',
              transferred_at: new Date().toISOString(),
            });

          // Update session completion date
          await supabaseAdmin
            .from('sessions')
            .update({
              completion_date: new Date().toISOString(),
              status: 'completed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', sessionId);
            
        } catch (error) {
          console.error('Error processing transfer:', error);
          return new Response(JSON.stringify({ 
            error: 'Failed to process payment transfer',
            details: error.message 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Session confirmation updated',
      bothConfirmed: Boolean(updatedSession?.tutor_confirmed && updatedSession?.student_confirmed)
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error confirming session:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
