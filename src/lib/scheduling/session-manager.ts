
import { supabase } from "@/integrations/supabase/client";
import { BookedSession } from "./types/booking";
import { format } from "date-fns";

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
        studentId: session.student_id,
        status: session.status // Add the status property
      };
    });
  } catch (err) {
    console.error("Failed to fetch tutor booked sessions:", err);
    return [];
  }
}
