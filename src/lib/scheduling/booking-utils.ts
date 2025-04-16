
// Utility functions for bookings
import { BookingSlot, BookedSession } from './types/booking';
import { format, parseISO, addMinutes } from 'date-fns';
import { supabase } from "@/integrations/supabase/client";

/**
 * Format a booking slot for display
 */
export function formatBookingSlot(slot: BookingSlot): string {
  const day = slot.day instanceof Date ? format(slot.day, 'EEEE, MMMM d') : 'Unknown date';
  return `${day} from ${slot.start} to ${slot.end}`;
}

/**
 * Calculate duration of a booking slot in minutes
 */
export function calculateSlotDurationMinutes(slot: BookingSlot): number {
  try {
    const startTime = parseISO(`2000-01-01T${slot.start}`);
    const endTime = parseISO(`2000-01-01T${slot.end}`);
    
    const durationMs = endTime.getTime() - startTime.getTime();
    return durationMs / (1000 * 60);
  } catch (err) {
    console.error("Error calculating slot duration:", err);
    return 0;
  }
}

/**
 * Create an end time based on start time and duration in minutes
 */
export function createEndTime(startTime: string, durationMinutes: number): string {
  try {
    const start = parseISO(`2000-01-01T${startTime}`);
    const end = addMinutes(start, durationMinutes);
    return format(end, 'HH:mm');
  } catch (err) {
    console.error("Error creating end time:", err);
    return startTime;
  }
}

/**
 * Create a new booking session in the database
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

    return { id: data.id };
  } catch (err) {
    console.error("Failed to create session booking:", err);
    return null;
  }
}

/**
 * Create a payment transaction for a session
 */
export async function createPaymentTransaction(
  sessionId: string,
  studentId: string,
  tutorId: string,
  amount: number
): Promise<{ id: string } | null> {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .insert({
        session_id: sessionId,
        student_id: studentId,
        tutor_id: tutorId,
        amount: amount,
        status: 'pending'
      })
      .select('id')
      .single();

    if (error) {
      console.error("Error creating payment transaction:", error);
      return null;
    }

    return { id: data.id };
  } catch (err) {
    console.error("Failed to create payment transaction:", err);
    return null;
  }
}
