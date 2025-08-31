
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';

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
      .select('*')
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

    // If both have confirmed, mark session as completed and create transfer
    if (updatedSession?.tutor_confirmed && updatedSession?.student_confirmed) {
      await supabaseAdmin
        .from('sessions')
        .update({
          completion_date: new Date().toISOString(),
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      // Create pending transfer for tutor payout simulation
      const { data: paymentData } = await supabaseAdmin
        .from('payment_transactions')
        .select('*')
        .eq('session_id', sessionId)
        .eq('status', 'completed')
        .single();

      if (paymentData) {
        // Calculate fees: 15% platform fee + Stripe's 2.9% + 30¢
        const amountInCents = Math.round(paymentData.amount * 100);
        const stripeFee = Math.round(amountInCents * 0.029 + 30);
        const platformFee = Math.round(amountInCents * 0.15);
        const tutorAmount = amountInCents - stripeFee - platformFee;

        await supabaseAdmin
          .from('pending_transfers')
          .insert({
            session_id: sessionId,
            tutor_id: paymentData.tutor_id,
            student_id: paymentData.student_id,
            amount: amountInCents,
            platform_fee: platformFee,
            status: 'pending',
          });
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
