import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-ESCROW] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Escrow processing started');
    
    // Initialize Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Parse request body
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      logStep('ERROR: No session ID provided');
      return new Response(JSON.stringify({ error: 'Session ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    logStep('Processing escrow for session', { sessionId });

    // Get session data to verify both parties have confirmed
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

    // Verify both parties have confirmed and session isn't already completed
    if (!session.tutor_confirmed || !session.student_confirmed) {
      logStep('ERROR: Both parties must confirm before escrow processing', {
        tutorConfirmed: session.tutor_confirmed,
        studentConfirmed: session.student_confirmed
      });
      return new Response(JSON.stringify({ error: 'Both parties must confirm before escrow processing' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if already completed (idempotency)
    if (session.completion_date) {
      logStep('Session already completed, skipping escrow processing', { 
        sessionId,
        completionDate: session.completion_date 
      });
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Session already completed',
        alreadyProcessed: true
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    logStep('Both parties confirmed - processing escrow');
    
    // Mark session as completed
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
      return new Response(JSON.stringify({ error: 'Failed to mark session as completed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    logStep('Session marked as completed successfully');

    // Find payment transaction for this session
    logStep('Looking for payment transaction');
    const { data: paymentData, error: paymentError } = await supabaseAdmin
      .from('payment_transactions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('status', 'completed')
      .single();

    if (paymentError) {
      logStep('Payment transaction lookup failed', { 
        error: paymentError.message,
        sessionId 
      });
      
      // Try without the status filter as fallback
      const { data: paymentDataFallback, error: paymentErrorFallback } = await supabaseAdmin
        .from('payment_transactions')
        .select('*')
        .eq('session_id', sessionId)
        .single();
        
      if (paymentDataFallback) {
        logStep('Found payment transaction without status filter', { 
          paymentStatus: paymentDataFallback.status,
          amount: paymentDataFallback.amount 
        });
        // Use fallback data
        const paymentToProcess = paymentDataFallback;
        return await processPayment(supabaseAdmin, sessionId, paymentToProcess);
      } else {
        logStep('No payment transaction found for session', { sessionId });
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Session completed but no payment transaction found',
          paymentProcessed: false
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (paymentData) {
      return await processPayment(supabaseAdmin, sessionId, paymentData);
    } else {
      logStep('WARNING: No payment transaction found - cannot create pending transfer');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Session completed but no payment found',
        paymentProcessed: false
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    logStep('ERROR: Escrow processing failed', { error: error.message });
    console.error('Error processing escrow:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function processPayment(supabaseAdmin: any, sessionId: string, paymentData: any) {
  logStep('Payment transaction found', { 
    paymentId: paymentData.id,
    amount: paymentData.amount,
    status: paymentData.status 
  });

  // Calculate fees: 15% platform fee + Stripe's 2.9% + 30¢
  const amountInCents = Math.round(paymentData.amount * 100);
  const stripeFee = Math.round(amountInCents * 0.029 + 30);
  const platformFee = Math.round(amountInCents * 0.15);
  const tutorAmount = amountInCents - stripeFee - platformFee;

  logStep('Fee calculation', {
    originalAmount: paymentData.amount,
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
    return new Response(JSON.stringify({ error: 'Failed to create pending transfer' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } else {
    logStep('Pending transfer created successfully', { tutorAmount, platformFee });
    
    // Process badges AFTER payment processing with error handling
    try {
      logStep('Initiating badge processing for completed session');
      const { data: badgeResult, error: badgeError } = await supabaseAdmin.functions.invoke(
        'process-session-badges',
        {
          body: { sessionId }
        }
      );

      if (badgeError) {
        logStep('WARNING: Badge processing failed but payment completed', { 
          error: badgeError.message 
        });
      } else {
        logStep('Badge processing completed successfully', badgeResult);
      }
    } catch (badgeException) {
      logStep('WARNING: Badge processing threw exception but payment completed', { 
        error: badgeException.message 
      });
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Escrow processing completed successfully',
      tutorAmount: tutorAmount / 100, // Convert back to dollars for response
      platformFee: platformFee / 100,
      paymentProcessed: true
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}