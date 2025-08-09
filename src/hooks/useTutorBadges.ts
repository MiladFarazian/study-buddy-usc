import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { badgeConfigs } from "@/lib/badgeConfig";

export interface EarnedBadge {
  id: string;
  badge_type: string;
  earned_date: string;
  criteria_met: any;
}

export interface BadgeProgress {
  total_sessions: number;
  current_streak_weeks: number;
  last_session_date: string | null;
  avg_rating: number;
  total_stress_reduction: number;
  avg_response_time_hours: number;
  student_improvement_score: number;
}

export function useTutorBadges(tutorId: string) {
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [progressData, setProgressData] = useState<BadgeProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBadgeData = useCallback(async () => {
    if (!tutorId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch earned badges
      const { data: badgesData, error: badgesError } = await supabase
        .from('tutor_badges')
        .select('*')
        .eq('tutor_id', tutorId)
        .eq('is_active', true);

      if (badgesError) {
        console.error("Error fetching badges:", badgesError);
      } else {
        setEarnedBadges(badgesData || []);
      }

      // Fetch progress data
      const { data: progressDataResult, error: progressError } = await supabase
        .from('badge_progress')
        .select('*')
        .eq('tutor_id', tutorId)
        .single();

      if (progressError && progressError.code !== 'PGRST116') {
        console.error("Error fetching progress data:", progressError);
      } else {
        setProgressData(progressDataResult);
      }

      // If no progress data exists, create it with basic session data
      if (!progressDataResult) {
        const { data: sessionData } = await supabase
          .from('sessions')
          .select('*')
          .eq('tutor_id', tutorId)
          .eq('status', 'completed');

        const { data: reviewData } = await supabase
          .from('student_reviews')
          .select('teaching_quality')
          .eq('tutor_id', tutorId);

        const totalSessions = sessionData?.length || 0;
        const avgRating = reviewData?.length > 0 
          ? reviewData.reduce((sum, review) => sum + (review.teaching_quality || 0), 0) / reviewData.length 
          : 0;

        const calculatedProgress: BadgeProgress = {
          total_sessions: totalSessions,
          current_streak_weeks: 0,
          last_session_date: sessionData?.[0]?.start_time || null,
          avg_rating: avgRating,
          total_stress_reduction: 0,
          avg_response_time_hours: 2.5,
          student_improvement_score: 0
        };

        setProgressData(calculatedProgress);

        // Insert the calculated progress into the database
        if (totalSessions > 0) {
          await supabase
            .from('badge_progress')
            .insert({
              tutor_id: tutorId,
              ...calculatedProgress
            });
        }
      }
    } catch (error) {
      console.error("Error in fetchBadgeData:", error);
    } finally {
      setLoading(false);
    }
  }, [tutorId]);

  useEffect(() => {
    fetchBadgeData();
  }, [fetchBadgeData]);

  // Calculate which badges are in progress
  const getProgressBadges = useCallback(() => {
    if (!progressData) return [];
    
    const earnedBadgeTypes = earnedBadges.map(badge => badge.badge_type);
    
    return Object.entries(badgeConfigs)
      .filter(([badgeType]) => !earnedBadgeTypes.includes(badgeType))
      .filter(([badgeType, config]) => {
        // Check if the badge has progress criteria we can track
        const criteria = (config as any)?.criteria;
        return criteria?.min_sessions || criteria?.min_avg_rating || criteria?.min_streak_weeks;
      })
      .map(([badgeType]) => badgeType);
  }, [progressData, earnedBadges]);

  return {
    earnedBadges,
    progressData,
    progressBadges: getProgressBadges(),
    loading,
    refreshBadges: fetchBadgeData
  };
}