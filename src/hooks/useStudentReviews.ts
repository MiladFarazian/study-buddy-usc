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
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching reviews...');
      supabase.auth.getSession()
        .then((s) => console.log('🔍 Auth session:', s))
        .catch((e) => console.error('🔍 Auth session error:', e));

      // Test 1: Try basic student_reviews query first (non-blocking debug)
      console.log('🔍 Testing basic student_reviews query...');
      supabase
        .from('student_reviews')
        .select('*')
        .limit(5)
        .then(
          ({ data: basicData, error: basicError }) => {
            console.log('🔍 Basic query results:', { data: basicData, error: basicError, count: basicData?.length || 0 });
          },
          (e) => console.error('🔍 Basic query failed:', e)
        );

      // Test 2: Try basic sessions query (non-blocking debug)
      console.log('🔍 Testing basic sessions query...');
      supabase
        .from('sessions')
        .select('id, student_first_name, student_last_name, tutor_first_name, tutor_last_name')
        .limit(5)
        .then(
          ({ data: sessionsData, error: sessionsError }) => {
            console.log('🔍 Sessions query results:', { data: sessionsData, error: sessionsError, count: sessionsData?.length || 0 });
          },
          (e) => console.error('🔍 Sessions query failed:', e)
        );

      // Test 3: Try the JOIN query
      console.log('🔍 Testing JOIN query...');
      const { data, error: fetchError } = await supabase
        .from('student_reviews')
        .select(`
          *,
          sessions (
            student_first_name,
            student_last_name,
            tutor_first_name,
            tutor_last_name
          )
        `)
        .order('created_at', { ascending: false });

      console.log('🔍 JOIN query results:', { data, error: fetchError, count: data?.length || 0 });

      if (fetchError) {
        console.error('🔍 Error fetching reviews:', fetchError);
        setError(fetchError.message);
        return;
      }

      if (!data || data.length === 0) {
        console.log('🔍 No data returned from JOIN query, trying fallback approach...');
        
        // Fallback: Use separate queries if JOIN fails
        console.log('🔍 Using fallback approach with separate queries...');
        const { data: basicData2, error: basicErr2 } = await supabase
          .from('student_reviews')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (basicErr2) {
          console.error('🔍 Fallback basic query error:', basicErr2);
          setReviews([]);
          return;
        }

        const sessionIds = (basicData2 || []).map((r: any) => r.session_id).filter(Boolean);
        const { data: sessions } = await supabase
          .from('sessions')
          .select('id, student_first_name, student_last_name, tutor_first_name, tutor_last_name')
          .in('id', sessionIds);

        const transformedDataFallback: StudentReviewWithNames[] = (basicData2 || []).map((review: any) => {
          const session = sessions?.find((s: any) => s.id === review.session_id);
          return {
            ...review,
            student_first_name: session?.student_first_name || null,
            student_last_name: session?.student_last_name || null,
            tutor_first_name: session?.tutor_first_name || null,
            tutor_last_name: session?.tutor_last_name || null,
          };
        });

        console.log('🔍 Fallback data prepared:', transformedDataFallback.length, 'reviews');
        setReviews(transformedDataFallback);
        return;
        
        setReviews([]);
        return;
      }

      // Transform the data to flatten the sessions join
      const transformedData: StudentReviewWithNames[] = data.map((review: any) => ({
        ...review,
        student_first_name: review.sessions?.student_first_name || null,
        student_last_name: review.sessions?.student_last_name || null,
        tutor_first_name: review.sessions?.tutor_first_name || null,
        tutor_last_name: review.sessions?.tutor_last_name || null,
      }));

      console.log('🔍 Final transformed data:', transformedData.length, 'reviews');
      setReviews(transformedData);
    } catch (err) {
      console.error('🔍 Error in fetchReviews:', err);
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