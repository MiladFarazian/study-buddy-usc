import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StudentReviewWithNames {
  review_id: string;
  session_id: string;
  student_id: string;
  tutor_id: string;
  student_first_name: string | null;
  student_last_name: string | null;
  tutor_first_name: string | null;
  tutor_last_name: string | null;
  // Student fields
  teaching_quality: number | null;
  subject_clarity: number | null;
  engagement_level: number | null;
  stress_before: number | null;
  stress_after: number | null;
  confidence_improvement: number | null;
  emotional_support: number | null;
  learning_anxiety_reduction: number | null;
  overall_wellbeing_impact: number | null;
  felt_judged: boolean | null;
  comfortable_asking_questions: string | null;
  would_book_again: boolean | null;
  written_feedback: string | null;
  student_showed_up: boolean | null;
  // Tutor fields
  came_prepared: number | null;
  respectful: number | null;
  motivation_effort: number | null;
  tutor_feedback: string | null;
  tutor_showed_up: boolean;
  created_at: string;
  updated_at: string;
}

export const useStudentReviews = () => {
  const [reviews, setReviews] = useState<StudentReviewWithNames[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use PostgREST syntax with explicit column selection - fetch ALL fields
      const { data, error: fetchError } = await supabase
        .from('student_reviews')
        .select(`
          review_id,
          session_id,
          student_id,
          tutor_id,
          teaching_quality,
          subject_clarity,
          engagement_level,
          stress_before,
          stress_after,
          confidence_improvement,
          emotional_support,
          learning_anxiety_reduction,
          overall_wellbeing_impact,
          felt_judged,
          comfortable_asking_questions,
          would_book_again,
          written_feedback,
          student_showed_up,
          came_prepared,
          respectful,
          motivation_effort,
          tutor_feedback,
          tutor_showed_up,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching reviews:', fetchError);
        setError(fetchError.message);
        return;
      }

      if (!data) {
        setReviews([]);
        return;
      }

      // Now fetch session data for each review
      const sessionIds = data.map(review => review.session_id);
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('id, student_first_name, student_last_name, tutor_first_name, tutor_last_name')
        .in('id', sessionIds);

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
        setError(sessionsError.message);
        return;
      }

      // Create a map of session data
      const sessionMap = new Map();
      sessionsData?.forEach(session => {
        sessionMap.set(session.id, session);
      });

      // Transform the data to include session names
      const transformedData: StudentReviewWithNames[] = data.map((review: any) => {
        const session = sessionMap.get(review.session_id);
        return {
          ...review,
          student_first_name: session?.student_first_name || null,
          student_last_name: session?.student_last_name || null,
          tutor_first_name: session?.tutor_first_name || null,
          tutor_last_name: session?.tutor_last_name || null,
        };
      });

      setReviews(transformedData);
    } catch (err) {
      console.error('Error in fetchReviews:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const refetch = useCallback(() => {
    fetchReviews();
  }, [fetchReviews]);

  return {
    reviews,
    loading,
    error,
    refetch
  };
};