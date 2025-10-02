import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BADGE_CONFIG } from "@/lib/badgeConfig";

// Simple module-level cache to avoid duplicate fetches in React StrictMode
const BADGE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const badgeCache = new Map<string, { ts: number; earned: EarnedBadge[]; progress: BadgeProgress | null }>();
const inFlight = new Map<string, Promise<void>>();

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

    const now = Date.now();
    const cached = badgeCache.get(tutorId);
    if (cached && now - cached.ts < BADGE_CACHE_TTL) {
      setEarnedBadges(cached.earned);
      setProgressData(cached.progress);
      setLoading(false);
      return;
    }

    // If a request for this tutor is already in-flight, wait for it
    const existing = inFlight.get(tutorId);
    if (existing) {
      await existing;
      const updated = badgeCache.get(tutorId);
      if (updated) {
        setEarnedBadges(updated.earned);
        setProgressData(updated.progress);
      }
      setLoading(false);
      return;
    }

    const req = (async () => {
      try {
        // Fetch earned badges
        const { data: badgesData, error: badgesError } = await supabase
          .from('tutor_badges')
          .select('*')
          .eq('tutor_id', tutorId)
          .eq('is_active', true);

        const earned = badgesData || [];
        if (badgesError) {
          console.error("Error fetching badges:", badgesError);
        }

        // Fetch progress data
        const { data: progressDataResult, error: progressError } = await supabase
          .from('badge_progress')
          .select('*')
          .eq('tutor_id', tutorId)
          .single();

        let progress: BadgeProgress | null = progressDataResult || null;
        if (progressError && progressError.code !== 'PGRST116') {
          console.error("Error fetching progress data:", progressError);
        }

        // If no progress data exists, perform lightweight local calculation (optional)
        if (!progress) {
          const { data: sessionData } = await supabase
            .from('sessions')
            .select('id, start_time')
            .eq('tutor_id', tutorId)
            .eq('status', 'completed');

          const { data: reviewData } = await supabase
            .from('student_reviews')
            .select('teaching_quality')
            .eq('tutor_id', tutorId);

          const totalSessions = sessionData?.length || 0;
          const avgRating = reviewData?.length ?
            reviewData.reduce((sum, r) => sum + (r.teaching_quality || 0), 0) / reviewData.length : 0;

          progress = {
            total_sessions: totalSessions,
            current_streak_weeks: 0,
            last_session_date: sessionData?.[0]?.start_time || null,
            avg_rating: avgRating,
            total_stress_reduction: 0,
            avg_response_time_hours: 2.5,
            student_improvement_score: 0,
          };

          if (totalSessions > 0) {
            await supabase.from('badge_progress').insert({ tutor_id: tutorId, ...progress });
          }
        }

        badgeCache.set(tutorId, { ts: Date.now(), earned, progress });
        setEarnedBadges(earned);
        setProgressData(progress);
      } catch (error) {
        console.error("Error in fetchBadgeData:", error);
      } finally {
        setLoading(false);
        inFlight.delete(tutorId);
      }
    })();

    inFlight.set(tutorId, req);
    await req;
  }, [tutorId]);

  useEffect(() => {
    fetchBadgeData();
  }, [fetchBadgeData]);

  // Calculate which badges are in progress
  const getProgressBadges = useCallback(() => {
    if (!progressData) return [];
    
    const earnedBadgeTypes = earnedBadges.map(badge => badge.badge_type);
    
    return Object.entries(BADGE_CONFIG)
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