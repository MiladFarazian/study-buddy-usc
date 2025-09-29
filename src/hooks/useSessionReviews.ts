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
    // Create stable dependency key to prevent infinite re-renders
    const idsKey = JSON.stringify([...new Set(sessionIds)].sort());
    
    const fetchReviews = async () => {
      const stableIds = JSON.parse(idsKey);
      
      if (stableIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('student_reviews')
          .select('session_id, teaching_quality, engagement_level, written_feedback')
          .in('session_id', stableIds);

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
  }, [JSON.stringify([...new Set(sessionIds)].sort())]);

  return { reviewsData, loading };
};