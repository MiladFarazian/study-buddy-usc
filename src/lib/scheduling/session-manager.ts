
import { supabase } from "@/integrations/supabase/client";
import { SessionCreationParams } from "./types/booking";

export async function getTutorUpcomingSessions(tutorId: string) {
  try {
    const { data: sessions, error } = await supabase
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
    return sessions || [];
  } catch (error) {
    console.error("Error fetching tutor sessions:", error);
    return [];
  }
}

export async function getStudentUpcomingSessions(studentId: string) {
  try {
    const { data: sessions, error } = await supabase
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
    return sessions || [];
  } catch (error) {
    console.error("Error fetching student sessions:", error);
    return [];
  }
}
