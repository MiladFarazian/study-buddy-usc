
import { supabase } from "@/integrations/supabase/client";
import { BookedSession } from "./types/booking";
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
      .in('status', ['confirmed', 'pending']); // Only include active bookings
    
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
 * Fetch sessions for a specific user (either as tutor or student)
 * Optimized version with a single join query instead of multiple separate queries
 */
export async function getUserSessions(
  userId: string,
  isTutor: boolean
): Promise<Session[]> {
  try {
    console.log("Getting sessions for user:", userId, "as tutor:", isTutor);
    
    // Use a more efficient query with joins to get all data in a single request
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
      .eq(isTutor ? 'tutor_id' : 'student_id', userId)
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
    
    // Process the sessions to include course information if needed
    const processedSessions: Session[] = [];
    
    for (const session of sessions) {
      // Format the session with default course details
      let courseDetails = null;
      
      // If there's a course ID, try to get its details
      if (session.course_id) {
        try {
          courseDetails = {
            id: session.course_id,
            course_number: session.course_id,
            course_title: '' 
          };
          
          // Try to get the course title if available
          const { data: courseData } = await supabase
            .from('courses-20251')
            .select('Course number, Course title')
            .eq('Course number', session.course_id)
            .maybeSingle();
            
          if (courseData) {
            courseDetails.course_title = courseData["Course title"] || '';
          }
        } catch (courseError) {
          console.warn("Error fetching course details:", courseError);
        }
      }
      
      processedSessions.push({
        ...session,
        course: courseDetails
      });
    }
    
    console.log("Processed sessions:", processedSessions);
    return processedSessions;
  } catch (error) {
    console.error("Error loading user sessions:", error);
    return [];
  }
}
