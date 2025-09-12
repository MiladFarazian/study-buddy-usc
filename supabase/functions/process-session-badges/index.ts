import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-BADGES] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Badge processing started');
    
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

    logStep('Processing badges for session', { sessionId });

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

    // Only process badges for completed sessions
    if (session.status !== 'completed') {
      logStep('Session not completed, skipping badge processing', { 
        sessionId,
        status: session.status 
      });
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Session not completed, badges not processed',
        badgesProcessed: false
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    logStep('Session is completed - processing badge updates');

    // Process badge progress updates with error handling
    try {
      await updateBadgeProgress(supabaseAdmin, session);
      logStep('Badge progress updated successfully');
    } catch (badgeError) {
      logStep('ERROR: Badge progress update failed', { error: badgeError.message });
      // Continue execution - don't fail the entire function
    }

    // Try to award badges with error handling
    try {
      await awardBadges(supabaseAdmin, session.tutor_id);
      logStep('Badge awarding completed successfully');
    } catch (badgeError) {
      logStep('ERROR: Badge awarding failed', { error: badgeError.message });
      // Continue execution - don't fail the entire function
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Badge processing completed',
      badgesProcessed: true
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logStep('ERROR: Badge processing failed', { error: error.message });
    console.error('Error processing badges:', error);
    return new Response(JSON.stringify({ 
      error: 'Badge processing failed',
      details: error.message,
      badgesProcessed: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function updateBadgeProgress(supabaseAdmin: any, session: any) {
  logStep('Updating badge progress for session completion');

  // Calculate stress reduction from student reviews for this session
  const { data: reviews, error: reviewError } = await supabaseAdmin
    .from('student_reviews')
    .select('stress_before, stress_after')
    .eq('session_id', session.id);

  const stressReduction = reviews && reviews.length > 0 
    ? reviews.reduce((sum: number, review: any) => 
        sum + ((review.stress_before || 0) - (review.stress_after || 0)), 0) / reviews.length
    : 0;

  // Calculate new average rating for the tutor
  const { data: allReviews, error: allReviewsError } = await supabaseAdmin
    .from('student_reviews')
    .select('teaching_quality')
    .eq('tutor_id', session.tutor_id)
    .not('teaching_quality', 'is', null);

  const newAvgRating = allReviews && allReviews.length > 0
    ? allReviews.reduce((sum: number, review: any) => sum + review.teaching_quality, 0) / allReviews.length
    : 0;

  // Determine streak logic
  const sessionDate = new Date(session.start_time).toISOString().split('T')[0];
  
  const { data: currentProgress } = await supabaseAdmin
    .from('badge_progress')
    .select('*')
    .eq('tutor_id', session.tutor_id)
    .single();

  let newStreak = 1;
  if (currentProgress?.last_session_date) {
    const lastDate = new Date(currentProgress.last_session_date);
    const currentDate = new Date(sessionDate);
    const weeksDiff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    
    if (weeksDiff === 0) {
      // Same week
      newStreak = currentProgress.current_streak_weeks || 1;
    } else if (weeksDiff === 1) {
      // Consecutive week
      newStreak = (currentProgress.current_streak_weeks || 0) + 1;
    } else {
      // Streak broken
      newStreak = 1;
    }
  }

  // Upsert progress with safe error handling
  const { error: progressError } = await supabaseAdmin
    .from('badge_progress')
    .upsert({
      tutor_id: session.tutor_id,
      total_sessions: (currentProgress?.total_sessions || 0) + 1,
      last_session_date: sessionDate,
      avg_rating: newAvgRating,
      total_stress_reduction: (currentProgress?.total_stress_reduction || 0) + stressReduction,
      current_streak_weeks: newStreak,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'tutor_id'
    });

  if (progressError) {
    logStep('ERROR: Failed to update badge progress', { error: progressError.message });
    throw new Error(`Badge progress update failed: ${progressError.message}`);
  }

  logStep('Badge progress updated successfully', {
    tutorId: session.tutor_id,
    totalSessions: (currentProgress?.total_sessions || 0) + 1,
    avgRating: newAvgRating,
    stressReduction,
    streak: newStreak
  });
}

async function awardBadges(supabaseAdmin: any, tutorId: string) {
  logStep('Attempting to award badges for tutor', { tutorId });

  try {
    // Call the existing award_badges_for_tutor function with error handling
    const { error: awardError } = await supabaseAdmin.rpc('award_badges_for_tutor', {
      input_tutor_id: tutorId
    });

    if (awardError) {
      logStep('ERROR: Badge awarding RPC failed', { error: awardError.message });
      throw new Error(`Badge awarding failed: ${awardError.message}`);
    }

    logStep('Badges awarded successfully for tutor', { tutorId });
  } catch (error) {
    logStep('ERROR: Exception during badge awarding', { error: error.message });
    throw error;
  }
}