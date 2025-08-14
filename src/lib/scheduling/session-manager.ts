
import { supabase } from "@/integrations/supabase/client";
import { BookedSession, SessionType } from "./types/booking";
import { format } from "date-fns";
import { Session } from "@/types/session";

/**
 * Fetch a tutor's booked sessions within a date range
 */
export async function getTutorBookedSessions(
  tutorId: string,
  startDate: Date,
  endDate: Date
): Promise<BookedSession[]> {
  try {
    // Format dates for database query
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();
    
    // Query sessions table
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('tutor_id', tutorId)
      .gte('start_time', startDateStr)
      .lte('start_time', endDateStr)
      .in('status', ['scheduled', 'in_progress']); // Only include active bookings
    
    if (error) {
      console.error("Error fetching tutor booked sessions:", error);
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Format data into BookedSession type
    return data.map(session => {
      const startTime = new Date(session.start_time);
      const endTime = new Date(session.end_time);
      
      return {
        id: session.id,
        date: startTime,
        start: format(startTime, 'HH:mm'),
        end: format(endTime, 'HH:mm'),
        tutorId: session.tutor_id,
        studentId: session.student_id
      };
    });
  } catch (err) {
    console.error("Failed to fetch tutor booked sessions:", err);
    return [];
  }
}

/**
 * Fetch ALL sessions for a specific user (both as tutor AND student)
 * Optimized version with batched course lookups to prevent N+1 queries
 */
export async function getUserSessions(
  userId: string,
  isTutor: boolean
): Promise<Session[]> {
  try {
    console.log("Getting sessions for user:", userId);
    
    // Single optimized query with all joins
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        *,
        tutor:profiles!sessions_tutor_id_fkey (
          id, 
          first_name, 
          last_name, 
          avatar_url
        ),
        student:profiles!sessions_student_id_fkey (
          id, 
          first_name, 
          last_name, 
          avatar_url
        )
      `)
      .or(`tutor_id.eq.${userId},student_id.eq.${userId}`)
      .order('start_time', { ascending: true });
    
    if (error) {
      console.error("Error fetching sessions:", error);
      throw error;
    }
    
    if (!sessions || sessions.length === 0) {
      console.log("No sessions found for user:", userId);
      return [];
    }
    
    console.log(`Found ${sessions.length} sessions for user ${userId}`);
    
    // Extract unique course IDs for batch lookup
    const courseIds = [...new Set(sessions
      .map(session => session.course_id)
      .filter(Boolean)
    )];
    
    // Batch fetch all course details at once
    let courseMap = new Map();
    if (courseIds.length > 0) {
      try {
        const { data: courses } = await supabase
          .from('courses-20251')
          .select('Course number, Course title')
          .in('Course number', courseIds);
          
        if (courses) {
          courseMap = new Map(
            courses.map(course => [
              course["Course number"], 
              course["Course title"] || ''
            ])
          );
        }
      } catch (courseError) {
        console.warn("Error batch fetching course details:", courseError);
      }
    }
    
    // Process sessions with pre-fetched course data
    const processedSessions: Session[] = sessions.map(session => {
      let courseDetails = null;
      
      if (session.course_id) {
        courseDetails = {
          id: session.course_id,
          course_number: session.course_id,
          course_title: courseMap.get(session.course_id) || ''
        };
      }
      
      const sessionType = session.session_type === 'virtual' ? 
        SessionType.VIRTUAL : SessionType.IN_PERSON;
      
      return {
        ...session,
        course: courseDetails,
        session_type: sessionType
      };
    });
    
    console.log("Processed sessions:", processedSessions);
    return processedSessions;
  } catch (error) {
    console.error("Error loading user sessions:", error);
    return [];
  }
}
