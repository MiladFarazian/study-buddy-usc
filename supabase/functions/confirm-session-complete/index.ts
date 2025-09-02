
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CONFIRM-SESSION] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Function started');
    
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logStep('ERROR: No authorization header');
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
      logStep('ERROR: Invalid token', { userError: userError?.message });
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    logStep('User authenticated', { userId: user.id });

    // Parse request body
    const { sessionId, userRole } = await req.json();
    
    if (!sessionId) {
      logStep('ERROR: No session ID provided');
      return new Response(JSON.stringify({ error: 'Session ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    logStep('Request parsed', { sessionId, userRole });

    // Get session data
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
      paymentStatus: session.payment_status,
      tutorConfirmed: session.tutor_confirmed,
      studentConfirmed: session.student_confirmed
    });

    // Check if user is authorized to confirm this session
    if (userRole === 'tutor' && session.tutor_id !== user.id) {
      logStep('ERROR: Unauthorized tutor confirmation', { userId: user.id, sessionTutorId: session.tutor_id });
      return new Response(JSON.stringify({ error: 'Unauthorized to confirm this session' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (userRole === 'student' && session.student_id !== user.id) {
      logStep('ERROR: Unauthorized student confirmation', { userId: user.id, sessionStudentId: session.student_id });
      return new Response(JSON.stringify({ error: 'Unauthorized to confirm this session' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    logStep('Authorization check passed');

    // Update the appropriate confirmation field
    const updateData = userRole === 'tutor' 
      ? { tutor_confirmed: true } 
      : { student_confirmed: true };
    
    logStep('Updating session confirmation', updateData);
    
    // Update session record
    const { error: updateError } = await supabaseAdmin
      .from('sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (updateError) {
      logStep('ERROR: Failed to update session', { error: updateError.message });
      return new Response(JSON.stringify({ error: 'Failed to update session' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    logStep('Session confirmation updated successfully');

    // Check if both parties have confirmed
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

    logStep('Updated session fetched', { 
      tutorConfirmed: updatedSession?.tutor_confirmed,
      studentConfirmed: updatedSession?.student_confirmed 
    });

    // If both have confirmed, mark session as completed and create transfer
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
        } else {
          logStep('No payment transaction found for session', { sessionId });
        }
      }

      if (paymentData) {
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
        } else {
          logStep('Pending transfer created successfully', { tutorAmount, platformFee });
        }
      } else {
        logStep('WARNING: No payment transaction found - cannot create pending transfer');
      }
    } else {
      logStep('Not both parties confirmed yet', {
        tutorConfirmed: updatedSession?.tutor_confirmed,
        studentConfirmed: updatedSession?.student_confirmed
      });
    }

    const bothConfirmed = Boolean(updatedSession?.tutor_confirmed && updatedSession?.student_confirmed);
    logStep('Function completed successfully', { bothConfirmed });

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Session confirmation updated',
      bothConfirmed,
      sessionStatus: updatedSession?.status,
      tutorConfirmed: updatedSession?.tutor_confirmed,
      studentConfirmed: updatedSession?.student_confirmed
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logStep('ERROR: Function failed', { error: error.message });
    console.error('Error confirming session:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
