import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SessionReviewData {
  teaching_quality: number | null;
  subject_clarity: number | null;
  written_feedback: string | null;
  engagement_level: number | null;
  came_prepared: number | null;
  tutor_feedback: string | null;
}

export const useSessionReview = (sessionId: string) => {
  return useQuery({
    queryKey: ['session-review', sessionId],
    queryFn: async (): Promise<SessionReviewData | null> => {
      const { data, error } = await supabase
        .from('student_reviews')
        .select('teaching_quality, subject_clarity, written_feedback, engagement_level, came_prepared, tutor_feedback')
        .eq('session_id', sessionId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching session review:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};