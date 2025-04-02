
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

    if (!sessionId || !userRole) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get session details
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('*, payment_transactions(*)')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if the user is authorized to confirm this session
    if (
      (userRole === 'tutor' && session.tutor_id !== user.id) || 
      (userRole === 'student' && session.student_id !== user.id)
    ) {
      return new Response(JSON.stringify({ error: 'Not authorized to confirm this session' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update the session confirmation status based on user role
    const updateData = userRole === 'tutor' 
      ? { tutor_confirmed: true } 
      : { student_confirmed: true };
    
    const { error: updateError } = await supabaseAdmin
      .from('sessions')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) {
      return new Response(JSON.stringify({ error: 'Failed to update session' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the updated session to check if both parties have confirmed
    const { data: updatedSession, error: getError } = await supabaseAdmin
      .from('sessions')
      .select('*, payment_transactions(*)')
      .eq('id', sessionId)
      .single();

    if (getError || !updatedSession) {
      return new Response(JSON.stringify({ error: 'Failed to retrieve updated session' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let transferResult = null;

    // If both tutor and student have confirmed, finalize the payment
    if (updatedSession.tutor_confirmed && updatedSession.student_confirmed) {
      // Find the payment transaction
      const paymentTransaction = updatedSession.payment_transactions[0];
      
      if (!paymentTransaction || !paymentTransaction.stripe_payment_intent_id) {
        return new Response(JSON.stringify({ 
          error: 'No payment found for this session',
          session: updatedSession
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (paymentTransaction.status !== 'completed') {
        return new Response(JSON.stringify({ 
          error: 'Payment has not been completed yet',
          session: updatedSession
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Only proceed if the transfer hasn't been completed yet
      if (paymentTransaction.transfer_status !== 'completed') {
        try {
          // Initialize Stripe
          const stripe = new Stripe(Deno.env.get('STRIPE_CONNECT_SECRET_KEY') || '', {
            apiVersion: '2023-10-16',
          });

          // Get tutor's Stripe Connect account ID
          const { data: tutorProfile, error: tutorError } = await supabaseAdmin
            .from('profiles')
            .select('stripe_connect_id')
            .eq('id', updatedSession.tutor_id)
            .single();

          if (tutorError || !tutorProfile?.stripe_connect_id) {
            throw new Error('Tutor Stripe Connect account not found');
          }

          // Create a transfer to the tutor's connected account
          const transfer = await stripe.transfers.create({
            amount: Math.floor((paymentTransaction.amount * 100) * 0.9), // 90% of the amount (10% platform fee)
            currency: 'usd',
            destination: tutorProfile.stripe_connect_id,
            source_transaction: paymentTransaction.stripe_payment_intent_id,
            metadata: {
              session_id: sessionId,
              payment_id: paymentTransaction.id,
              tutor_id: updatedSession.tutor_id,
              student_id: updatedSession.student_id
            }
          });

          // Create a record of the transfer
          const { data: transferRecord, error: transferError } = await supabaseAdmin
            .from('payment_transfers')
            .insert({
              payment_id: paymentTransaction.id,
              session_id: sessionId,
              tutor_id: updatedSession.tutor_id,
              student_id: updatedSession.student_id,
              amount: paymentTransaction.amount * 0.9, // 90% to tutor
              platform_fee: paymentTransaction.amount * 0.1, // 10% platform fee
              transfer_id: transfer.id,
              status: 'completed',
              transferred_at: new Date().toISOString()
            })
            .select()
            .single();

          if (transferError) {
            console.error('Error creating transfer record:', transferError);
          }

          // Update payment transaction with transfer status
          const { error: paymentUpdateError } = await supabaseAdmin
            .from('payment_transactions')
            .update({
              transfer_status: 'completed',
              transfer_id: transfer.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', paymentTransaction.id);

          if (paymentUpdateError) {
            console.error('Error updating payment transaction:', paymentUpdateError);
          }

          // Update session completion date
          const { error: sessionUpdateError } = await supabaseAdmin
            .from('sessions')
            .update({
              status: 'completed',
              completion_date: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', sessionId);

          if (sessionUpdateError) {
            console.error('Error updating session completion:', sessionUpdateError);
          }

          transferResult = transfer;
        } catch (error) {
          console.error('Error processing transfer:', error);
          return new Response(JSON.stringify({ 
            error: `Failed to process payment: ${error.message}`,
            session: updatedSession
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      session: updatedSession,
      transfer: transferResult
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error confirming session:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to confirm session' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
