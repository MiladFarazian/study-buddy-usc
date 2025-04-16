
import { supabase } from "@/integrations/supabase/client";
import { BookingSlot, SessionCreationParams } from "./types/booking";

export async function createSessionBooking(
  studentId: string,
  tutorId: string,
  courseId: string | null,
  startTime: string,
  endTime: string,
  location: string | null,
  notes: string | null
) {
  const params: SessionCreationParams = {
    studentId,
    tutorId,
    courseId,
    startTime,
    endTime,
    location,
    notes
  };

  try {
    console.log("Creating session booking with params:", params);

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
      .select()
      .single();
      
    if (error) {
      console.error("Supabase error creating session:", error);
      throw error;
    }
    
    console.log("Session successfully created:", data);
    return data;
  } catch (error) {
    console.error("Error creating session booking:", error);
    throw error;
  }
}

export async function bookSession(
  tutorId: string,
  studentId: string,
  slot: BookingSlot,
  duration: number
) {
  try {
    const startDateTime = new Date(slot.day);
    const [startHour, startMinute] = slot.start.split(':').map(Number);
    startDateTime.setHours(startHour, startMinute, 0, 0);
    
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + duration);
    
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        tutor_id: tutorId,
        student_id: studentId,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: 'pending',
        payment_status: 'unpaid'
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      success: true,
      sessionId: data.id
    };
  } catch (error) {
    console.error("Error booking session:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to book session"
    };
  }
}
