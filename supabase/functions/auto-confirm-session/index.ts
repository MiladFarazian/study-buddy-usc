import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AUTO-CONFIRM] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Auto-confirm function started');

    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Parse request body - handle empty body gracefully
    let sessionId;
    try {
      const body = await req.text();
      if (body) {
        const parsed = JSON.parse(body);
        sessionId = parsed.sessionId;
      }
    } catch (parseError) {
      logStep('ERROR: Failed to parse request body', { error: parseError.message });
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!sessionId) {
      logStep('ERROR: No session ID provided');
      return new Response(JSON.stringify({ error: 'Session ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    logStep('Request parsed', { sessionId });

    // Get session data to find tutor and student IDs
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      logStep('ERROR: Session not found', { sessionId, error: sessionError?.message });
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    logStep('Session found', { 
      sessionId,
      tutorId: session.tutor_id, 
      studentId: session.student_id,
      currentStatus: session.status,
      tutorConfirmed: session.tutor_confirmed,
      studentConfirmed: session.student_confirmed
    });

    // Get tutor and student user data for auth tokens
    const { data: tutorUser, error: tutorError } = await supabaseAdmin.auth.admin.getUserById(session.tutor_id);
    const { data: studentUser, error: studentError } = await supabaseAdmin.auth.admin.getUserById(session.student_id);

    if (tutorError || !tutorUser) {
      logStep('ERROR: Could not get tutor user data', { error: tutorError?.message });
      return new Response(JSON.stringify({ error: 'Could not get tutor user data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (studentError || !studentUser) {
      logStep('ERROR: Could not get student user data', { error: studentError?.message });
      return new Response(JSON.stringify({ error: 'Could not get student user data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate access tokens for both users
    const { data: tutorSession, error: tutorSessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: tutorUser.user.email!,
      options: { redirectTo: 'https://localhost:3000' }
    });

    const { data: studentSession, error: studentSessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink', 
      email: studentUser.user.email!,
      options: { redirectTo: 'https://localhost:3000' }
    });

    if (tutorSessionError || studentSessionError) {
      logStep('ERROR: Could not generate user sessions', { 
        tutorError: tutorSessionError?.message,
        studentError: studentSessionError?.message 
      });
      return new Response(JSON.stringify({ error: 'Could not generate user sessions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const results = [];

    // Confirm as student if not already confirmed 
    if (!session.student_confirmed) {
      logStep('Confirming as student');
      
      const { error: studentConfirmError } = await supabaseAdmin
        .from('sessions')
        .update({ student_confirmed: true })
        .eq('id', sessionId);

      if (studentConfirmError) {
        logStep('ERROR: Failed to confirm as student', { error: studentConfirmError.message });
        results.push({ role: 'student', success: false, error: studentConfirmError.message });
      } else {
        logStep('Student confirmation successful');
        results.push({ role: 'student', success: true });
      }
    } else {
      logStep('Student already confirmed');
      results.push({ role: 'student', success: true, message: 'Already confirmed' });
    }

    // Confirm as tutor if not already confirmed
    if (!session.tutor_confirmed) {
      logStep('Confirming as tutor');
      
      const { error: tutorConfirmError } = await supabaseAdmin
        .from('sessions')
        .update({ tutor_confirmed: true })
        .eq('id', sessionId);

      if (tutorConfirmError) {
        logStep('ERROR: Failed to confirm as tutor', { error: tutorConfirmError.message });
        results.push({ role: 'tutor', success: false, error: tutorConfirmError.message });
      } else {
        logStep('Tutor confirmation successful');
        results.push({ role: 'tutor', success: true });
      }
    } else {
      logStep('Tutor already confirmed');
      results.push({ role: 'tutor', success: true, message: 'Already confirmed' });
    }

    // Now check if both are confirmed and trigger completion logic
    const { data: updatedSession, error: fetchError } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError) {
      logStep('ERROR: Failed to fetch updated session', { error: fetchError.message });
      return new Response(JSON.stringify({ error: 'Failed to fetch updated session' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // If both are now confirmed, complete the session and create pending transfer
    if (updatedSession?.tutor_confirmed && updatedSession?.student_confirmed) {
      logStep('Both parties confirmed - completing session');
      
      const { error: completionError } = await supabaseAdmin
        .from('sessions')
        .update({
          completion_date: new Date().toISOString(),
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (completionError) {
        logStep('ERROR: Failed to mark session as completed', { error: completionError.message });
      } else {
        logStep('Session marked as completed successfully');
      }

      // Find payment transaction for this session
      logStep('Looking for payment transaction');
      const { data: paymentData, error: paymentError } = await supabaseAdmin
        .from('payment_transactions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (paymentError) {
        logStep('Payment transaction lookup failed', { 
          error: paymentError.message,
          sessionId 
        });
      } else if (paymentData) {
        logStep('Payment transaction found', { 
          paymentId: paymentData.id,
          amount: paymentData.amount,
          status: paymentData.status 
        });

        // Only create pending transfer if payment is completed
        if (paymentData.status === 'completed') {
          // Calculate fees: 15% platform fee + Stripe's 2.9% + 30¢
          // paymentData.amount is already in cents after migration
          const amountInCents = Math.round(paymentData.amount);
          const stripeFee = Math.round(amountInCents * 0.029 + 30);
          const platformFee = Math.round(amountInCents * 0.15);
          const tutorAmount = amountInCents - stripeFee - platformFee;

          logStep('Fee calculation', {
            originalAmountCents: paymentData.amount,
            amountInCents,
            stripeFee,
            platformFee,
            tutorAmount
          });

          const { error: transferError } = await supabaseAdmin
            .from('pending_transfers')
            .insert({
              session_id: sessionId,
              tutor_id: paymentData.tutor_id,
              student_id: paymentData.student_id,
              amount: tutorAmount, // Store the tutor's net amount
              platform_fee: platformFee,
              status: 'pending',
              payment_transaction_id: paymentData.id,
            });

          if (transferError) {
            logStep('ERROR: Failed to create pending transfer', { error: transferError.message });
          } else {
            logStep('Pending transfer created successfully', { tutorAmount, platformFee });
          }
        } else {
          logStep('WARNING: Payment not completed - pending transfer not created', { paymentStatus: paymentData.status });
        }
      }
    }

    logStep('Auto-confirm function completed successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Auto-confirmation completed',
      results,
      sessionStatus: updatedSession?.status,
      bothConfirmed: Boolean(updatedSession?.tutor_confirmed && updatedSession?.student_confirmed),
      tutorConfirmed: updatedSession?.tutor_confirmed,
      studentConfirmed: updatedSession?.student_confirmed
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logStep('ERROR: Auto-confirm function failed', { error: error.message });
    console.error('Error in auto-confirm:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});