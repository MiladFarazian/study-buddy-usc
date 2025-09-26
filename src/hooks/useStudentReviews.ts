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
    console.log('[useStudentReviews] fetch start');
    setLoading(true);
    setError(null);

    let finished = false;
    const watchdog = setTimeout(() => {
      if (!finished) {
        console.warn('[useStudentReviews] fetch timeout watchdog fired, forcing loading=false');
        setLoading(false);
      }
    }, 8000);

    try {
      console.log('[useStudentReviews] querying student_reviews...');
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('student_reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      console.log('[useStudentReviews] student_reviews result', { err: reviewsError, count: reviewsData?.length });

      if (reviewsError) {
        console.error('Error fetching student_reviews:', reviewsError);
        setError(reviewsError.message);
        setReviews([]);
      } else if (!reviewsData || reviewsData.length === 0) {
        console.log('[useStudentReviews] no reviews found');
        setReviews([]);
      } else {
        const sessionIds = Array.from(new Set((reviewsData || []).map((r: any) => r.session_id).filter(Boolean)));
        console.log('[useStudentReviews] fetching sessions for ids:', sessionIds.length);
        let sessionsById: Record<string, any> = {};

        if (sessionIds.length > 0) {
          const { data: sessionsData, error: sessionsError } = await supabase
            .from('sessions')
            .select('id, student_first_name, student_last_name, tutor_first_name, tutor_last_name')
            .in('id', sessionIds);
          console.log('[useStudentReviews] sessions result', { err: sessionsError, count: sessionsData?.length });

          if (sessionsError) {
            console.warn('Sessions fetch failed, proceeding without names:', sessionsError.message);
          } else {
            sessionsById = Object.fromEntries((sessionsData || []).map((s: any) => [s.id, s]));
          }
        }

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
        console.log('[useStudentReviews] merged count', merged.length);
        setReviews(merged);
      }
    } catch (err) {
      console.error('Error in fetchReviews:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setReviews([]);
    } finally {
      clearTimeout(watchdog);
      finished = true;
      console.log('[useStudentReviews] fetch end, setting loading=false');
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