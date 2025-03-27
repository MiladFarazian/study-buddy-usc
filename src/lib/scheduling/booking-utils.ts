
import { supabase } from "@/integrations/supabase/client";
import { BookingSlot } from "./types";
import { createNotification } from "../notification-service";

// Get tutor's booked sessions
export async function getTutorBookedSessions(
  tutorId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('tutor_id', tutorId)
      .gte('start_time', startDate.toISOString())
      .lte('end_time', endDate.toISOString());
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error fetching tutor booked sessions:", error);
    return [];
  }
}

// Create a session booking
export const createSessionBooking = async (
  studentId: string,
  tutorId: string,
  courseId: string | null,
  startTime: string,
  endTime: string,
  location: string | null,
  notes: string | null
) => {
  try {
    // Create session record
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        tutor_id: tutorId,
        student_id: studentId,
        start_time: startTime,
        end_time: endTime,
        course_id: courseId,
        location: location,
        notes: notes,
        status: 'pending',
        payment_status: 'unpaid'
      })
      .select()
      .single();
      
    if (error) throw error;
    
    // Create a notification for the tutor
    await createNotification({
      userId: tutorId,
      title: "New Session Booking",
      message: `A student has booked a session with you for ${new Date(startTime).toLocaleString()}`,
      type: "session_booked",
      metadata: { sessionId: data.id }
    });
    
    return data;
  } catch (error) {
    console.error("Error creating session booking:", error);
    throw error;
  }
};

// Helper to update the session status
export const updateSessionStatus = async (
  sessionId: string,
  status: string
) => {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .update({ status })
      .eq('id', sessionId)
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error updating session status:", error);
    throw error;
  }
};

// Enhance the BookingSlot type to include tutorId
export const enhanceBookingSlot = (slot: BookingSlot, tutorId: string): BookingSlot & { tutorId: string } => {
  return {
    ...slot,
    tutorId
  };
};
