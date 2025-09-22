import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

// Admin client (service role)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CancellationRequest {
  session_id: string;
  cancellation_reason: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, cancellation_reason }: CancellationRequest = await req.json();
    
    if (!session_id || !cancellation_reason) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'session_id and cancellation_reason are required' 
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    }

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Authorization header required' 
      }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    }

    // Create client with user's token to verify authentication
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid authentication' 
      }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    }

    console.log('[cancel-session] Processing cancellation for session:', session_id, 'by user:', user.id);

    // Fetch session details using admin client
    const { data: session, error: fetchError } = await supabaseAdmin
      .from('sessions')
      .select(`
        id, status, start_time, session_type, zoom_meeting_id,
        student_id, tutor_id
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

    // Determine user's role in this session
    let cancelled_by_role: 'student' | 'tutor';
    if (user.id === session.student_id) {
      cancelled_by_role = 'student';
    } else if (user.id === session.tutor_id) {
      cancelled_by_role = 'tutor';
    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'User is not authorized to cancel this session' 
      }), { 
        status: 403, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    }

    console.log('[cancel-session] User role determined:', cancelled_by_role);

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

    // For now, we'll use a default payment amount of $50 (5000 cents) for refund calculation
    // This will be replaced with actual payment data in the next iteration
    const defaultPaymentAmount = 5000; // $50.00 in cents

    // Calculate refund amounts using our database function
    const { data: refundData, error: refundError } = await supabaseAdmin
      .rpc('calculate_refund_amounts', {
        original_amount: defaultPaymentAmount,
        cancelled_by_role: cancelled_by_role,
        hours_before: hoursBeforeSession
      });

    if (refundError) {
      console.error('[cancel-session] Refund calculation error:', refundError);
      throw refundError;
    }

    let refundAmount = 0;
    let tutorPayout = 0;

    if (refundData && refundData.length > 0) {
      refundAmount = refundData[0].student_refund;
      tutorPayout = refundData[0].tutor_payout;
      console.log('[cancel-session] Calculated refund amount:', refundAmount, 'tutor payout:', tutorPayout);
    }

    // Try to delete Zoom meeting if present (best effort)
    if ((session.session_type === 'virtual' || session.session_type === 'VIRTUAL') && session.zoom_meeting_id) {
      try {
        await supabaseAdmin.functions.invoke('delete-zoom-meeting', { 
          body: { meeting_id: session.zoom_meeting_id } 
        });
        console.log('[cancel-session] Zoom meeting deleted successfully');
      } catch (zoomError) {
        console.error('[cancel-session] Zoom deletion error:', zoomError);
      }
    }

    // Update session with cancellation data
    const { error: updateError } = await supabaseAdmin
      .from('sessions')
      .update({
        status: 'cancelled',
        cancelled_by_user_id: user.id,
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
      cancelled_by_role: cancelled_by_role,
      refund_amount: refundAmount,
      tutor_payout: tutorPayout,
      hours_before_session: hoursBeforeSession,
      message: 'Session cancelled successfully. Stripe refund processing will be added in the next step.'
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