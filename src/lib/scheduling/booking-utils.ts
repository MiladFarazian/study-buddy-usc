
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, startOfDay, endOfDay, addDays } from "date-fns";
import { BookingSlot, WeeklyAvailability } from "./types";
import { mapDateToDayOfWeek } from "./availability-utils";

// Get existing sessions for the tutor to determine which slots are already booked
export async function getTutorBookedSessions(tutorId: string, startDate: Date, endDate: Date) {
  try {
    // Convert dates to ISO strings for the database query
    const startDateStr = startOfDay(startDate).toISOString();
    const endDateStr = endOfDay(addDays(endDate, 6)).toISOString();
    
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('tutor_id', tutorId)
      .gte('start_time', startDateStr)
      .lte('end_time', endDateStr)
      .in('status', ['confirmed', 'pending']);
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error fetching tutor booked sessions:", error);
    return [];
  }
}

// Generate available booking slots based on tutor's availability and existing bookings
export function generateAvailableSlots(
  availability: WeeklyAvailability,
  bookedSessions: any[],
  startDate: Date,
  daysToShow: number = 7
): BookingSlot[] {
  const slots: BookingSlot[] = [];
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  // Create a map of booked slots for quick lookup
  const bookedSlotMap = new Map();
  bookedSessions.forEach(session => {
    const day = format(parseISO(session.start_time), 'yyyy-MM-dd');
    const start = format(parseISO(session.start_time), 'HH:mm');
    const end = format(parseISO(session.end_time), 'HH:mm');
    const key = `${day}-${start}-${end}`;
    bookedSlotMap.set(key, true);
  });
  
  // Generate slots for each day
  for (let i = 0; i < daysToShow; i++) {
    const currentDate = addDays(startDate, i);
    const dayOfWeek = mapDateToDayOfWeek(currentDate);
    const formattedDate = format(currentDate, 'yyyy-MM-dd');
    
    // Get availability for this day of the week
    const dayAvailability = availability[dayOfWeek] || [];
    
    console.log(`Generating slots for ${formattedDate} (${dayOfWeek}), found ${dayAvailability.length} time slots`);
    
    // For each available time slot in the day
    dayAvailability.forEach(slot => {
      // Check if the slot is already booked
      const slotKey = `${formattedDate}-${slot.start}-${slot.end}`;
      const isBooked = bookedSlotMap.has(slotKey);
      
      slots.push({
        tutorId: '',  // Will be set by the calling function
        day: currentDate,
        start: slot.start,
        end: slot.end,
        available: !isBooked
      });
    });
  }
  
  return slots;
}

// Create a new session booking
export async function createSessionBooking(
  studentId: string,
  tutorId: string,
  courseId: string | null,
  startTime: string,
  endTime: string,
  location: string | null,
  notes: string | null
) {
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
      .select()
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error creating session booking:", error);
    throw error;
  }
}
