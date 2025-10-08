import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek } from "date-fns";

/**
 * Get the start of the calendar week (Sunday) for a given date
 */
export function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 0 }); // 0 = Sunday
}

/**
 * Get the end of the calendar week (Saturday) for a given date
 */
export function getWeekEnd(date: Date): Date {
  return endOfWeek(date, { weekStartsOn: 0 }); // 0 = Sunday
}

/**
 * Count tutor's scheduled sessions in a given week
 */
export async function getTutorSessionsInWeek(
  tutorId: string,
  weekStartDate: Date
): Promise<number> {
  const weekStart = getWeekStart(weekStartDate);
  const weekEnd = getWeekEnd(weekStartDate);

  const { data, error } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("tutor_id", tutorId)
    .gte("start_time", weekStart.toISOString())
    .lte("start_time", weekEnd.toISOString())
    .in("status", ["scheduled", "completed"]);

  if (error) {
    console.error("Error fetching tutor sessions in week:", error);
    return 0;
  }

  return data?.length || 0;
}

/**
 * Get tutor's max weekly sessions setting (null = no limit)
 */
export async function getTutorWeeklyLimit(tutorId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from("tutors")
    .select("max_weekly_sessions")
    .eq("profile_id", tutorId)
    .single();

  if (error) {
    console.error("Error fetching tutor weekly limit:", error);
    return null;
  }

  return data?.max_weekly_sessions || null;
}

/**
 * Check if tutor has reached their weekly limit for a given date
 */
export async function isTutorAtWeeklyLimit(
  tutorId: string,
  sessionDate: Date
): Promise<boolean> {
  const limit = await getTutorWeeklyLimit(tutorId);
  
  // No limit set
  if (!limit) return false;

  const sessionsInWeek = await getTutorSessionsInWeek(tutorId, sessionDate);
  
  return sessionsInWeek >= limit;
}
