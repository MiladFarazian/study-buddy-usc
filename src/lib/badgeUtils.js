import { supabase } from "@/integrations/supabase/client";
import { BADGE_CONFIG, getBadgeConfig, meetsBadgeCriteria } from "@/lib/badgeConfig.js";

// Calculate progress [0..1], isEarned flag, and display text per badge
export function calculateBadgeProgress(progressData = {}, badgeType) {
  const config = getBadgeConfig(badgeType);
  if (!config) return { isEarned: false, progress: 0, displayText: "" };

  const crit = config.criteria || {};
  const current = {
    sessions: Number(progressData.total_sessions || 0),
    rating: Number(progressData.avg_rating || 0),
    streak: Number(progressData.current_streak_weeks || 0),
    responseHrs: Number(progressData.avg_response_time_hours || 0),
    avgStressReduction: (() => {
      const total = Number(progressData.total_stress_reduction || 0);
      const sessions = Number(progressData.total_sessions || 0);
      return sessions > 0 ? total / sessions : 0;
    })(),
  };

  let progress = 0;
  let displayText = "";

  if (crit.min_sessions) {
    progress = clamp01(current.sessions / crit.min_sessions);
    displayText = `${current.sessions}/${crit.min_sessions} sessions`;
  } else if (crit.min_avg_rating) {
    progress = clamp01(current.rating / crit.min_avg_rating);
    displayText = `${current.rating.toFixed(1)}/${crit.min_avg_rating} rating`;
  } else if (crit.min_streak_weeks) {
    progress = clamp01(current.streak / crit.min_streak_weeks);
    displayText = `${current.streak}/${crit.min_streak_weeks} week streak`;
  } else if (crit.max_avg_response_hours) {
    // Inverse: lower hours is better
    progress = clamp01(1 - current.responseHrs / crit.max_avg_response_hours);
    displayText = `${current.responseHrs.toFixed(1)}h ≤ ${crit.max_avg_response_hours}h`;
  } else if (crit.min_avg_stress_reduction) {
    progress = clamp01(current.avgStressReduction / crit.min_avg_stress_reduction);
    displayText = `${current.avgStressReduction.toFixed(1)}/${crit.min_avg_stress_reduction} improvement`;
  } else if (crit.top_percentile) {
    // Requires global comparison, cannot compute locally → show goal
    progress = 0;
    displayText = `Aim: Top ${crit.top_percentile}%`;
  }

  const isEarned = progressData ? Boolean(meetsBadgeCriteria?.(progressData, {}, badgeType)) : false;
  return { isEarned, progress, displayText };
}

// Check and award badges for a tutor, returns array of newly earned badge types
export async function checkAndAwardBadges(tutorId) {
  if (!tutorId) return [];

  // Ensure progress exists
  const { data: progress, error: progErr } = await supabase
    .from('badge_progress')
    .select('*')
    .eq('tutor_id', tutorId)
    .maybeSingle();
  if (progErr) console.error('Progress fetch error', progErr);

  const currentBadges = await getExistingBadges(tutorId);
  const already = new Set((currentBadges || []).map(b => b.badge_type || b.type));

  const newlyEarned = new Set();
  const checks = await runAllChecks(tutorId, progress || {});
  for (const type of checks) {
    if (!already.has(type)) newlyEarned.add(type);
  }

  // Ask the database to award (SECURITY DEFINER RPC)
  try {
    await supabase.rpc('award_badges_for_tutor', { input_tutor_id: tutorId });
  } catch (e) {
    console.warn('award_badges_for_tutor RPC failed', e);
  }

  return Array.from(newlyEarned);
}

async function getExistingBadges(tutorId) {
  const { data, error } = await supabase
    .from('tutor_badges')
    .select('badge_type, created_at')
    .eq('tutor_id', tutorId)
    .eq('is_active', true);
  if (error) {
    console.error('Existing badges fetch error', error);
    return [];
  }
  return data || [];
}

// --- Specific checks ---
export function checkSessionBadges(progress = {}) {
  const res = [];
  const sessions = Number(progress.total_sessions || 0);
  if (sessions >= 50) res.push('over_50_sessions');
  if (sessions >= 100) res.push('over_100_sessions');
  return res;
}

export async function checkFoundingTutor(tutorId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('created_at')
    .eq('id', tutorId)
    .maybeSingle();
  if (error || !data?.created_at) return false;
  
  // Get cutoff date from badge config
  const foundingBadgeConfig = getBadgeConfig('founding_tutor');
  const cutoffDate = foundingBadgeConfig?.criteria?.signup_before || '2025-10-01';
  const cutoff = new Date(cutoffDate + 'T00:00:00Z');
  return new Date(data.created_at) < cutoff;
}

export function checkTopRated(progress = {}) {
  const rating = Number(progress.avg_rating || 0);
  const sessions = Number(progress.total_sessions || 0);
  return rating >= 4.5 && sessions >= 10;
}

export async function checkSuperstar(progress = {}) {
  const sessions = Number(progress.total_sessions || 0);
  if (sessions < 10) return false;
  const { data, error } = await supabase
    .from('badge_progress')
    .select('tutor_id, avg_rating, total_sessions');
  if (error || !data?.length) return false;
  const eligible = data.filter(d => Number(d.total_sessions || 0) >= 10);
  if (!eligible.length) return false;
  eligible.sort((a, b) => Number(b.avg_rating||0) - Number(a.avg_rating||0));
  const topCount = Math.max(1, Math.ceil(eligible.length * 0.05));
  const topIds = new Set(eligible.slice(0, topCount).map(d => d.tutor_id));
  return topIds.has(progress.tutor_id) || topIds.has(progress?.tutor_id);
}

export function checkSuccessChampion(progress = {}) {
  const sessions = Number(progress.total_sessions || 0);
  const totalReduction = Number(progress.total_stress_reduction || 0);
  const avg = sessions > 0 ? totalReduction / sessions : 0;
  return avg >= 2.0 && sessions >= 15;
}

export function checkStreakBadge(progress = {}) {
  const streak = Number(progress.current_streak_weeks || 0);
  return streak >= 2;
}

export function checkQuickResponder(progress = {}) {
  const hours = Number(progress.avg_response_time_hours || 0);
  const sessions = Number(progress.total_sessions || 0);
  return hours > 0 && hours <= 2 && sessions >= 20;
}

export async function checkIndustryProfessional(tutorId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('bio')
    .eq('id', tutorId)
    .maybeSingle();
  if (error) return false;
  const bio = (data?.bio || '').toLowerCase();
  const keywords = ['industry', 'internship', 'software engineer', 'consultant', 'analyst', 'researcher'];
  return keywords.some(k => bio.includes(k));
}

export async function checkAdvancedDegree(tutorId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('bio')
    .eq('id', tutorId)
    .maybeSingle();
  if (error) return false;
  const bio = (data?.bio || '').toLowerCase();
  const keywords = ['phd', 'doctorate', 'masters', 'm.s', 'msc', 'm.eng', 'mfa'];
  return keywords.some(k => bio.includes(k));
}

async function runAllChecks(tutorId, progress) {
  const results = new Set();

  // Session based
  checkSessionBadges(progress).forEach(t => results.add(t));
  if (await checkFoundingTutor(tutorId)) results.add('founding_tutor');

  // Performance
  if (checkTopRated(progress)) results.add('top_rated');
  if (await checkSuperstar({ ...progress, tutor_id: tutorId })) results.add('superstar');
  if (checkSuccessChampion(progress)) results.add('student_success_champion');

  // Streak & response
  if (checkStreakBadge(progress)) results.add('weekly_tutoring_streak');
  if (checkQuickResponder(progress)) results.add('quick_responder');

  // Verification
  if (await checkIndustryProfessional(tutorId)) results.add('industry_professional');
  if (await checkAdvancedDegree(tutorId)) results.add('advanced_degree');

  return Array.from(results);
}

function clamp01(n) { return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0)); }
