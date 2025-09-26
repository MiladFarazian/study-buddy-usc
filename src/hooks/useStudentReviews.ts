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
  teaching_quality: number | null;
  stress_before: number | null;
  stress_after: number | null;
  tutor_showed_up: boolean;
  student_showed_up: boolean | null;
  written_feedback: string | null;
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

      const { data, error: fetchError } = await supabase
        .from('student_reviews')
        .select(`
          review_id,
          session_id,
          student_id,
          tutor_id,
          teaching_quality,
          stress_before,
          stress_after,
          tutor_showed_up,
          student_showed_up,
          written_feedback,
          created_at,
          updated_at,
          sessions!inner(
            student_first_name,
            student_last_name,
            tutor_first_name,
            tutor_last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching reviews:', fetchError);
        setError(fetchError.message);
        return;
      }

      // Transform the data to flatten the sessions join
      const transformedData: StudentReviewWithNames[] = data?.map((review: any) => ({
        ...review,
        student_first_name: review.sessions?.student_first_name || null,
        student_last_name: review.sessions?.student_last_name || null,
        tutor_first_name: review.sessions?.tutor_first_name || null,
        tutor_last_name: review.sessions?.tutor_last_name || null,
      })) || [];

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