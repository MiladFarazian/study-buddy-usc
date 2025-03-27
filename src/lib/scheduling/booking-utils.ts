
import { supabase } from "@/integrations/supabase/client";
import { BookingSlot } from "./types";
import { createNotification } from "../notification-service";

// Create a session booking
export const createSessionBooking = async (
  tutorId: string,
  studentId: string,
  startTime: Date,
  endTime: Date,
  courseId?: string,
  notes?: string
) => {
  try {
    // Create session record
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        tutor_id: tutorId,
        student_id: studentId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        course_id: courseId,
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
