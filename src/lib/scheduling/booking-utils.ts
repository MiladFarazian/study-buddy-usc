
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { BookingSlot } from "./types/booking";

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
    console.log(`Creating session booking using booking-utils for student ${studentId} with tutor ${tutorId}`);
    
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
 * Check if a booking slot is available
 */
export function isSlotAvailable(
  slot: BookingSlot,
  bookedSessions: any[]
): boolean {
  if (!slot.available) return false;
  
  const slotDay = slot.day instanceof Date ? slot.day : new Date(slot.day);
  const slotStart = slot.start;
  const slotEnd = slot.end;

  // Check if this slot overlaps with any booked session
  for (const session of bookedSessions) {
    const sessionStart = format(new Date(session.start_time), 'HH:mm');
    const sessionEnd = format(new Date(session.end_time), 'HH:mm');
    const sessionDay = new Date(session.start_time);
    
    // Only check sessions on the same day
    if (sessionDay.toDateString() === slotDay.toDateString()) {
      // Check for overlap
      if (
        (slotStart >= sessionStart && slotStart < sessionEnd) ||
        (slotEnd > sessionStart && slotEnd <= sessionEnd) ||
        (slotStart <= sessionStart && slotEnd >= sessionEnd)
      ) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Calculate session price based on duration and hourly rate
 */
export function calculateSessionPrice(durationMinutes: number, hourlyRate: number): number {
  return (hourlyRate / 60) * durationMinutes;
}
