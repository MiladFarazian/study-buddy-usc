import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SessionReviewData {
  session_id: string;
  session_date: string;
  duration_hours: number;
  student_id: string;
  tutor_id: string;
  student_first_name: string | null;
  student_last_name: string | null;
  tutor_first_name: string | null;
  tutor_last_name: string | null;
  course_id: string | null;
  session_status: string;
  start_time: string;
  end_time: string;
  
  // Student review of tutor
  student_review: {
    review_id: string | null;
    teaching_quality: number | null;
    subject_clarity: number | null;
    stress_before: number | null;
    stress_after: number | null;
    confidence_improvement: number | null;
    emotional_support: number | null;
    tutor_showed_up: boolean | null;
    written_feedback: string | null;
    would_book_again: boolean | null;
    comfortable_asking_questions: string | null;
    learning_anxiety_reduction: number | null;
    overall_wellbeing_impact: number | null;
    created_at: string | null;
  } | null;
  
  // Tutor review of student (from same table but different perspective)
  tutor_review: {
    review_id: string | null;
    engagement_level: number | null;
    came_prepared: number | null;
    respectful: number | null;
    motivation_effort: number | null;
    student_showed_up: boolean | null;
    tutor_feedback: string | null;
    created_at: string | null;
  } | null;
}

export const useSessionReviews = () => {
  const [sessionReviews, setSessionReviews] = useState<SessionReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessionReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching session-centric reviews...');

      // Fetch all sessions with their associated reviews
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          id,
          student_id,
          tutor_id,
          start_time,
          end_time,
          course_id,
          status,
          student_first_name,
          student_last_name,
          tutor_first_name,
          tutor_last_name
        `)
        .order('start_time', { ascending: false });

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
        setError(sessionsError.message);
        return;
      }

      if (!sessions || sessions.length === 0) {
        setSessionReviews([]);
        return;
      }

      // Fetch all student reviews
      const { data: studentReviews, error: reviewsError } = await supabase
        .from('student_reviews')
        .select('*');

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
        setError(reviewsError.message);
        return;
      }

      // Transform the data to session-centric format
      const transformedData: SessionReviewData[] = sessions.map(session => {
        // Find student review for this session
        const studentReview = studentReviews?.find(review => review.session_id === session.id);
        
        const duration = session.start_time && session.end_time 
          ? (new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / (1000 * 60 * 60)
          : 0;

        return {
          session_id: session.id,
          session_date: session.start_time,
          duration_hours: Math.round(duration * 10) / 10,
          student_id: session.student_id,
          tutor_id: session.tutor_id,
          student_first_name: session.student_first_name,
          student_last_name: session.student_last_name,
          tutor_first_name: session.tutor_first_name,
          tutor_last_name: session.tutor_last_name,
          course_id: session.course_id,
          session_status: session.status,
          start_time: session.start_time,
          end_time: session.end_time,
          
          // Student reviewing tutor data
          student_review: studentReview ? {
            review_id: studentReview.review_id,
            teaching_quality: studentReview.teaching_quality,
            subject_clarity: studentReview.subject_clarity,
            stress_before: studentReview.stress_before,
            stress_after: studentReview.stress_after,
            confidence_improvement: studentReview.confidence_improvement,
            emotional_support: studentReview.emotional_support,
            tutor_showed_up: studentReview.tutor_showed_up,
            written_feedback: studentReview.written_feedback,
            would_book_again: studentReview.would_book_again,
            comfortable_asking_questions: studentReview.comfortable_asking_questions,
            learning_anxiety_reduction: studentReview.learning_anxiety_reduction,
            overall_wellbeing_impact: studentReview.overall_wellbeing_impact,
            created_at: studentReview.created_at,
          } : null,
          
          // Tutor reviewing student data (from same review record)
          tutor_review: studentReview ? {
            review_id: studentReview.review_id,
            engagement_level: studentReview.engagement_level,
            came_prepared: studentReview.came_prepared,
            respectful: studentReview.respectful,
            motivation_effort: studentReview.motivation_effort,
            student_showed_up: studentReview.student_showed_up,
            tutor_feedback: studentReview.tutor_feedback,
            created_at: studentReview.created_at,
          } : null,
        };
      });

      console.log('🔍 Session-centric data prepared:', transformedData.length, 'sessions');
      setSessionReviews(transformedData);
    } catch (err) {
      console.error('🔍 Error in fetchSessionReviews:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessionReviews();
  }, [fetchSessionReviews]);

  const refetch = useCallback(() => {
    fetchSessionReviews();
  }, [fetchSessionReviews]);

  return {
    sessionReviews,
    loading,
    error,
    refetch
  };
};