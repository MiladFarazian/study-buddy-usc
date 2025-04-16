
import { supabase } from "@/integrations/supabase/client";
import { BookedSession } from "./types/booking";
import { format, parseISO } from "date-fns";

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
    
    console.log(`Fetching sessions for tutor ${tutorId} from ${startDateStr} to ${endDateStr}`);
    
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
      console.log(`No booked sessions found for tutor ${tutorId} in the specified date range`);
      return [];
    }
    
    console.log(`Found ${data.length} booked sessions for tutor ${tutorId}`);
    
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
 * Create a new session booking
 */
export async function createSessionBooking(
  studentId: string,
  tutorId: string,
  courseId: string | null,
  startTime: string,
  endTime: string,
  location: string | null,
  notes: string | null
): Promise<{ id: string } | null> {
  try {
    console.log(`Creating session booking for student ${studentId} with tutor ${tutorId}`);
    console.log(`Start time: ${startTime}, End time: ${endTime}`);
    
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        student_id: studentId,
        tutor_id: tutorId,
        course_id: courseId,
        start_time: startTime,
        end_time: endTime,
        location: location,
        notes: notes,
        status: 'pending',
        payment_status: 'unpaid'
      })
      .select('id')
      .single();
    
    if (error) {
      console.error("Error creating session booking:", error);
      return null;
    }
    
    console.log(`Session created successfully with ID: ${data.id}`);
    return { id: data.id };
  } catch (err) {
    console.error("Failed to create session booking:", err);
    return null;
  }
}

/**
 * Get sessions for a user (as either tutor or student)
 */
export async function getUserSessions(
  userId: string,
  role: 'tutor' | 'student',
  status?: string[]
): Promise<any[]> {
  try {
    console.log(`Fetching ${role} sessions for user ${userId}`);
    
    let query = supabase
      .from('sessions')
      .select('*')
      .eq(`${role}_id`, userId);
    
    if (status && status.length > 0) {
      query = query.in('status', status);
    }
    
    const { data, error } = await query.order('start_time', { ascending: true });
    
    if (error) {
      console.error(`Error fetching ${role} sessions:`, error);
      return [];
    }
    
    console.log(`Found ${data?.length || 0} ${role} sessions for user ${userId}`);
    return data || [];
  } catch (err) {
    console.error(`Failed to fetch ${role} sessions:`, err);
    return [];
  }
}
