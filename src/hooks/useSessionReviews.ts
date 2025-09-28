import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SessionReviewData {
  teaching_quality: number | null;
  engagement_level: number | null;
  written_feedback: string | null;
}

export const useSessionReviews = (sessionIds: string[]) => {
  const [reviewsData, setReviewsData] = useState<Map<string, SessionReviewData>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      if (sessionIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('student_reviews')
          .select('session_id, teaching_quality, engagement_level, written_feedback')
          .in('session_id', sessionIds);

        if (error) {
          console.error('Error fetching session reviews:', error);
          return;
        }

        const reviewMap = new Map<string, SessionReviewData>();
        data?.forEach(review => {
          reviewMap.set(review.session_id, {
            teaching_quality: review.teaching_quality,
            engagement_level: review.engagement_level,
            written_feedback: review.written_feedback
          });
        });

        setReviewsData(reviewMap);
      } catch (error) {
        console.error('Error fetching session reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [sessionIds]);

  return { reviewsData, loading };
};