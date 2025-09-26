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
  // Additional review fields from the database
  engagement_level: number | null;
  subject_clarity: number | null;
  respectful: number | null;
  came_prepared: number | null;
  motivation_effort: number | null;
  would_book_again: boolean | null;
  tutor_feedback: string | null;
}

export const useStudentReviews = () => {
  const [reviews, setReviews] = useState<StudentReviewWithNames[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Step 1: fetch latest student reviews (simple, reliable)
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('student_reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (reviewsError) {
        console.error('Error fetching student_reviews:', reviewsError);
        setError(reviewsError.message);
        setReviews([]);
        return;
      }

      if (!reviewsData || reviewsData.length === 0) {
        setReviews([]);
        return;
      }

      // Step 2: fetch session names for these reviews
      const sessionIds = Array.from(new Set((reviewsData || []).map((r: any) => r.session_id).filter(Boolean)));
      let sessionsById: Record<string, any> = {};

      if (sessionIds.length > 0) {
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select('id, student_first_name, student_last_name, tutor_first_name, tutor_last_name')
          .in('id', sessionIds);

        if (sessionsError) {
          console.warn('Sessions fetch failed, proceeding without names:', sessionsError.message);
        } else {
          sessionsById = Object.fromEntries((sessionsData || []).map((s: any) => [s.id, s]));
        }
      }

      // Step 3: merge and set
      const merged: StudentReviewWithNames[] = (reviewsData || []).map((review: any) => {
        const s = sessionsById[review.session_id] || {};
        return {
          ...review,
          student_first_name: s.student_first_name ?? null,
          student_last_name: s.student_last_name ?? null,
          tutor_first_name: s.tutor_first_name ?? null,
          tutor_last_name: s.tutor_last_name ?? null,
        } as StudentReviewWithNames;
      });

      setReviews(merged);
    } catch (err) {
      console.error('Error in fetchReviews:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setReviews([]);
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