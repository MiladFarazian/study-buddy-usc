
import { supabase } from "@/integrations/supabase/client";
import { BookedSession } from "./types/booking";
import { format } from "date-fns";

// Get a tutor's booked sessions within a date range
export async function getTutorBookedSessions(tutorId: string, startDate: Date, endDate: Date): Promise<BookedSession[]> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('tutor_id', tutorId)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .not('status', 'eq', 'cancelled');
    
    if (error) {
      console.error('Error fetching tutor sessions:', error);
      return [];
    }
    
    // Convert to BookedSession format
    const bookedSessions: BookedSession[] = (data || []).map(session => {
      const startTime = new Date(session.start_time);
      const endTime = new Date(session.end_time);
      
      return {
        id: session.id,
        date: startTime,
        start: format(startTime, 'HH:mm'),
        end: format(endTime, 'HH:mm'),
        studentId: session.student_id,
        tutorId: session.tutor_id
      };
    });
    
    return bookedSessions;
  } catch (error) {
    console.error('Error in getTutorBookedSessions:', error);
    return [];
  }
}

// Get a student's upcoming sessions
export async function getStudentUpcomingSessions(studentId: string) {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        tutor:profiles!tutor_id (
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('student_id', studentId)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching student sessions:", error);
    return [];
  }
}

// Get a tutor's upcoming sessions
export async function getTutorUpcomingSessions(tutorId: string) {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        student:profiles!student_id (
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('tutor_id', tutorId)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching tutor sessions:", error);
    return [];
  }
}
