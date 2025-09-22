import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";

// Admin client (service role)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CancellationRequest {
  session_id: string;
  cancellation_reason: string;
  cancelled_by_role: 'student' | 'tutor' | 'admin';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, cancellation_reason, cancelled_by_role }: CancellationRequest = await req.json();
    
    if (!session_id || !cancellation_reason || !cancelled_by_role) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'session_id, cancellation_reason, and cancelled_by_role are required' 
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    }

    console.log('[cancel-session] Processing cancellation for session:', session_id, 'by:', cancelled_by_role);

    // Fetch session details including payment information
    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select(`
        id, status, start_time, session_type, zoom_meeting_id,
        stripe_payment_intent_id, student_id, tutor_id
      `)
      .eq('id', session_id)
      .maybeSingle();

    if (fetchError) {
      console.error('[cancel-session] Database fetch error:', fetchError);
      throw fetchError;
    }
    
    if (!session) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Session not found' 
      }), { 
        status: 404, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    }

    // Prevent double cancellation
    if (session.status === 'cancelled') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Session is already cancelled' 
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    }

    // Validate session is cancellable (not already completed)
    if (session.status === 'completed') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Cannot cancel completed session' 
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    }

    // Calculate hours before session
    const sessionStartTime = new Date(session.start_time);
    const currentTime = new Date();
    const hoursBeforeSession = Math.max(0, Math.floor((sessionStartTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60)));

    console.log('[cancel-session] Hours before session:', hoursBeforeSession);

    // Get the user ID who is cancelling
    const { data: authUser } = await supabase.auth.admin.getUserById(
      cancelled_by_role === 'student' ? session.student_id : session.tutor_id
    );

    let refundAmount = 0;
    let tutorPayout = 0;
    let stripeRefundId = null;

    // If there's a payment intent, calculate refunds and process Stripe refund
    if (session.stripe_payment_intent_id) {
      console.log('[cancel-session] Processing refund for payment intent:', session.stripe_payment_intent_id);

      // Get the original payment amount from Stripe
      try {
        const paymentIntentResponse = await fetch(`https://api.stripe.com/v1/payment_intents/${session.stripe_payment_intent_id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        if (!paymentIntentResponse.ok) {
          const error = await paymentIntentResponse.text();
          console.error('[cancel-session] Stripe payment intent fetch error:', error);
          throw new Error(`Failed to fetch payment intent: ${error}`);
        }

        const paymentIntent = await paymentIntentResponse.json();
        const originalAmount = paymentIntent.amount; // Amount in cents

        console.log('[cancel-session] Original payment amount:', originalAmount);

        // Calculate refund amounts using our database function
        const { data: refundData, error: refundError } = await supabase
          .rpc('calculate_refund_amounts', {
            original_amount: originalAmount,
            cancelled_by_role: cancelled_by_role,
            hours_before: hoursBeforeSession
          });

        if (refundError) {
          console.error('[cancel-session] Refund calculation error:', refundError);
          throw refundError;
        }

        if (refundData && refundData.length > 0) {
          refundAmount = refundData[0].student_refund;
          tutorPayout = refundData[0].tutor_payout;

          console.log('[cancel-session] Calculated refund amount:', refundAmount, 'tutor payout:', tutorPayout);

          // Process Stripe refund if refund amount > 0
          if (refundAmount > 0) {
            const refundResponse = await fetch('https://api.stripe.com/v1/refunds', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${stripeSecretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                payment_intent: session.stripe_payment_intent_id,
                amount: refundAmount.toString(),
                reason: 'requested_by_customer',
              }),
            });

            if (!refundResponse.ok) {
              const error = await refundResponse.text();
              console.error('[cancel-session] Stripe refund error:', error);
              throw new Error(`Stripe refund failed: ${error}`);
            }

            const refund = await refundResponse.json();
            stripeRefundId = refund.id;
            console.log('[cancel-session] Stripe refund created:', stripeRefundId);
          }
        }
      } catch (stripeError) {
        console.error('[cancel-session] Stripe processing error:', stripeError);
        // Continue with cancellation even if refund fails - log the error but don't fail the cancellation
        console.log('[cancel-session] Continuing with cancellation despite refund error');
      }
    }

    // Try to delete Zoom meeting if present (best effort)
    if ((session.session_type === 'virtual' || session.session_type === 'VIRTUAL') && session.zoom_meeting_id) {
      try {
        await supabase.functions.invoke('delete-zoom-meeting', { 
          body: { meeting_id: session.zoom_meeting_id } 
        });
        console.log('[cancel-session] Zoom meeting deleted successfully');
      } catch (zoomError) {
        console.error('[cancel-session] Zoom deletion error:', zoomError);
      }
    }

    // Update session with cancellation data
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        status: 'cancelled',
        cancelled_by_user_id: authUser?.user?.id || null,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: cancellation_reason,
        refund_amount: refundAmount,
        hours_before_session: hoursBeforeSession,
        zoom_meeting_id: null,
        zoom_join_url: null,
        zoom_start_url: null,
        zoom_password: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session_id);

    if (updateError) {
      console.error('[cancel-session] Database update error:', updateError);
      throw updateError;
    }

    console.log('[cancel-session] Session cancelled successfully');

    return new Response(JSON.stringify({ 
      success: true,
      refund_amount: refundAmount,
      tutor_payout: tutorPayout,
      stripe_refund_id: stripeRefundId,
      hours_before_session: hoursBeforeSession
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json', ...corsHeaders } 
    });

  } catch (error: any) {
    console.error('[cancel-session] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Unknown error' 
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json', ...corsHeaders } 
    });
  }
});