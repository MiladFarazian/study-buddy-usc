
import { format, addDays, isSameDay, parseISO, isValid, startOfDay } from 'date-fns';
import { supabase } from "@/integrations/supabase/client";
import { AvailabilitySlot, WeeklyAvailability, BookingSlot, SessionBooking } from "@/types/scheduling";

// Helper function to map date to day of week
export const mapDateToDayOfWeek = (date: Date): string => {
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return dayNames[date.getDay()];
};

// Get tutor's availability settings from the database
export const getTutorAvailability = async (tutorId: string): Promise<WeeklyAvailability | null> => {
  try {
    const { data, error } = await supabase
      .from('tutor_availability')
      .select('availability')
      .eq('tutor_id', tutorId)
      .single();

    if (error) {
      console.error("Error fetching tutor availability:", error);
      return null;
    }

    return data?.availability as WeeklyAvailability || null;
  } catch (error) {
    console.error("Error in getTutorAvailability:", error);
    return null;
  }
};

// Get tutor's booked sessions for a date range
export const getTutorBookedSessions = async (
  tutorId: string,
  startDate: Date,
  endDate: Date
): Promise<SessionBooking[]> => {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('tutor_id', tutorId)
      .gte('start_time', startDate.toISOString())
      .lte('end_time', endDate.toISOString())
      .in('status', ['confirmed', 'pending']);

    if (error) {
      console.error("Error fetching tutor sessions:", error);
      return [];
    }

    return (data || []).map(session => ({
      id: session.id,
      tutorId: session.tutor_id,
      studentId: session.student_id,
      startTime: new Date(session.start_time),
      endTime: new Date(session.end_time),
      status: session.status as 'pending' | 'confirmed' | 'cancelled'
    }));
  } catch (error) {
    console.error("Error in getTutorBookedSessions:", error);
    return [];
  }
};

// Generate available time slots based on availability and booked sessions
export const generateAvailableSlots = (
  availability: WeeklyAvailability,
  bookedSessions: SessionBooking[],
  startDate: Date,
  daysToGenerate: number
): BookingSlot[] => {
  const slots: BookingSlot[] = [];
  const currentDate = startOfDay(startDate);

  // Generate slots for each day
  for (let dayOffset = 0; dayOffset < daysToGenerate; dayOffset++) {
    const date = addDays(currentDate, dayOffset);
    const dayOfWeek = mapDateToDayOfWeek(date);
    const dayAvailability = availability[dayOfWeek] || [];

    // For each availability slot for this day of the week
    dayAvailability.forEach(slot => {
      // Create a time slot
      const timeSlot: BookingSlot = {
        tutorId: '', // Will be set by caller
        day: new Date(date),
        start: slot.start,
        end: slot.end,
        available: true
      };

      // Check if this slot overlaps with any booked sessions
      const isBooked = bookedSessions.some(session => {
        // Check if the session is on the same day
        if (!isSameDay(session.startTime, timeSlot.day)) {
          return false;
        }

        // Extract hours and minutes
        const sessionStartHours = session.startTime.getHours();
        const sessionStartMinutes = session.startTime.getMinutes();
        const sessionEndHours = session.endTime.getHours();
        const sessionEndMinutes = session.endTime.getMinutes();

        const slotStartParts = timeSlot.start.split(':').map(Number);
        const slotEndParts = timeSlot.end.split(':').map(Number);

        const slotStartHours = slotStartParts[0];
        const slotStartMinutes = slotStartParts[1];
        const slotEndHours = slotEndParts[0];
        const slotEndMinutes = slotEndParts[1];

        // Check if there's an overlap
        const sessionStartTime = sessionStartHours * 60 + sessionStartMinutes;
        const sessionEndTime = sessionEndHours * 60 + sessionEndMinutes;
        const slotStartTime = slotStartHours * 60 + slotStartMinutes;
        const slotEndTime = slotEndHours * 60 + slotEndMinutes;

        return (
          (sessionStartTime < slotEndTime && sessionEndTime > slotStartTime) ||
          (slotStartTime < sessionEndTime && slotEndTime > sessionStartTime)
        );
      });

      // If not booked, add to available slots
      if (!isBooked) {
        slots.push(timeSlot);
      }
    });
  }

  return slots;
};

// Helper for creating a session booking
export const createSessionBooking = async (
  studentId: string,
  tutorId: string,
  courseId: string | null,
  startTime: string,
  endTime: string,
  location: string | null,
  notes: string | null
): Promise<{ id: string } | null> => {
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
        status: 'confirmed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error("Error creating session booking:", error);
      return null;
    }

    return data ? { id: data.id } : null;
  } catch (error) {
    console.error("Error in createSessionBooking:", error);
    return null;
  }
};

// Helper for creating a payment transaction
export const createPaymentTransaction = async (
  sessionId: string,
  studentId: string,
  tutorId: string,
  amount: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('payment_transactions')
      .insert({
        session_id: sessionId,
        student_id: studentId,
        tutor_id: tutorId,
        amount: amount,
        status: 'completed',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error("Error creating payment transaction:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in createPaymentTransaction:", error);
    return false;
  }
};
