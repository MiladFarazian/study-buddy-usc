
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
 */
export async function getUserSessions(
  userId: string,
  isTutor: boolean
): Promise<Session[]> {
  try {
    // Step 1: Fetch basic session data first
    const { data: basicSessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq(isTutor ? 'tutor_id' : 'student_id', userId)
      .order('start_time', { ascending: true });
      
    if (sessionError) {
      console.error("Error fetching user sessions:", sessionError);
      return [];
    }
    
    if (!basicSessionData || basicSessionData.length === 0) {
      return [];
    }
    
    // Step 2: Process sessions one by one to avoid deep type instantiation
    const formattedSessions: Session[] = [];
    
    for (const session of basicSessionData) {
      // Step 3: Get tutor details
      const { data: tutorData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('id', session.tutor_id)
        .maybeSingle();
        
      // Step 4: Get student details
      const { data: studentData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('id', session.student_id)
        .maybeSingle();
      
      // Step 5: Get course details if available
      let courseDetails = null;
      if (session.course_id) {
        try {
          courseDetails = {
            id: session.course_id,
            course_number: session.course_id,
            course_title: '' // Default empty title
          };
          
          // Try to get the course title if available
          try {
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
        } catch (courseError) {
          console.warn("Error processing course details:", courseError);
        }
      }
      
      // Step 6: Construct the complete session object
      formattedSessions.push({
        ...session,
        tutor: tutorData || undefined,
        student: studentData || undefined,
        course: courseDetails
      });
    }
    
    return formattedSessions;
  } catch (error) {
    console.error("Error loading user sessions:", error);
    return [];
  }
}

