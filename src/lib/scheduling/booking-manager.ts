
import { supabase } from "@/integrations/supabase/client";
import { BookedSession, BookingSlot } from "./types/booking";
import { format, parseISO } from 'date-fns';

/**
 * Gets all booked sessions for a tutor within a date range
 */
export async function getTutorBookedSessions(tutorId: string, startDate: Date, endDate: Date): Promise<BookedSession[]> {
  try {
    // Format dates for the query
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');
    
    // Query the database for booked sessions
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('tutor_id', tutorId)
      .gte('start_time', `${startDateStr}T00:00:00`)
      .lte('start_time', `${endDateStr}T23:59:59`)
      .neq('status', 'cancelled');
    
    if (error) {
      console.error("Error fetching booked sessions:", error);
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Convert to BookedSession format
    const bookedSessions: BookedSession[] = data.map(session => ({
      id: session.id,
      tutorId: session.tutor_id,
      studentId: session.student_id,
      date: format(new Date(session.start_time), 'yyyy-MM-dd'),
      start: format(new Date(session.start_time), 'HH:mm'),
      end: format(new Date(session.end_time), 'HH:mm'),
      status: session.status
    }));
    
    return bookedSessions;
  } catch (err) {
    console.error("Failed to fetch tutor booked sessions:", err);
    return [];
  }
}

/**
 * Create a new booking session
 */
export async function createBookingSession(booking: {
  tutorId: string;
  studentId: string;
  startTime: Date;
  endTime: Date;
  notes?: string;
  courseId?: string;
}): Promise<{ id: string } | null> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        tutor_id: booking.tutorId,
        student_id: booking.studentId,
        start_time: booking.startTime.toISOString(),
        end_time: booking.endTime.toISOString(),
        notes: booking.notes || null,
        course_id: booking.courseId || null,
        status: 'confirmed',
        payment_status: 'pending'
      })
      .select('id')
      .single();
      
    if (error) {
      console.error("Error creating booking session:", error);
      return null;
    }
    
    return { id: data.id };
  } catch (err) {
    console.error("Failed to create booking session:", err);
    return null;
  }
}

/**
 * Update a booking session status
 */
export async function updateBookingStatus(sessionId: string, status: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('sessions')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);
      
    if (error) {
      console.error("Error updating booking status:", error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Failed to update booking status:", err);
    return false;
  }
}

/**
 * Check if a booking slot is available
 */
export function isBookingSlotAvailable(slot: BookingSlot, bookedSessions: BookedSession[]): boolean {
  const slotDay = slot.day instanceof Date ? format(slot.day, 'yyyy-MM-dd') : format(new Date(slot.day), 'yyyy-MM-dd');
  
  // Filter booked sessions for the slot day
  const sessionsOnDay = bookedSessions.filter(session => session.date === slotDay);
  
  // Check if the slot conflicts with any booked session
  for (const session of sessionsOnDay) {
    if (
      (slot.start >= session.start && slot.start < session.end) ||
      (slot.end > session.start && slot.end <= session.end) ||
      (slot.start <= session.start && slot.end >= session.end)
    ) {
      return false;
    }
  }
  
  return true;
}
