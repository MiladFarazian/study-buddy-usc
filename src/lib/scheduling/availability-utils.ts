import { supabase } from "@/integrations/supabase/client";
import { WeeklyAvailability, BookingSlot } from "./types";
import { format, addDays } from 'date-fns';

// Get tutor's availability from their profile
export async function getTutorAvailability(tutorId: string): Promise<WeeklyAvailability | null> {
  try {
    if (!tutorId) {
      console.error("No tutor ID provided to getTutorAvailability");
      return null;
    }
    
    console.log("Fetching availability for tutor:", tutorId);
    
    // Check if we have an active session first
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      console.log("No active auth session when fetching tutor availability - public data access mode");
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('availability')
      .eq('id', tutorId)
      .single();
      
    if (error) {
      if (error.message.includes("JWT")) {
        console.error("Authentication error when fetching tutor availability:", error);
        throw new Error("Authentication required to view tutor availability");
      } else {
        console.error("Error fetching tutor availability:", error);
      }
      return null;
    }
    
    // Log the result for debugging
    console.log("Tutor availability data:", data?.availability);
    
    // Ensure we return the availability in the correct format
    if (data?.availability) {
      // Check if it's a valid object with day properties
      const avail = data.availability as WeeklyAvailability;
      const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      // Ensure all days exist in the availability object
      const cleanAvailability: WeeklyAvailability = {};
      weekDays.forEach(day => {
        cleanAvailability[day] = avail[day] || [];
      });
      
      return cleanAvailability;
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching tutor availability:", error);
    throw error; // Re-throw to allow for more specific error handling
  }
}

// Update tutor's availability in their profile
export async function updateTutorAvailability(
  tutorId: string, 
  availability: WeeklyAvailability
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ availability })
      .eq('id', tutorId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Error updating tutor availability:", error);
    return false;
  }
}

// Map a date to the day of the week
export function mapDateToDayOfWeek(date: Date): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

// Check if a date has availability based on the day of the week
export function hasAvailabilityForDate(date: Date, availability: WeeklyAvailability): boolean {
  const dayOfWeek = mapDateToDayOfWeek(date);
  return availability[dayOfWeek]?.length > 0;
}

// Generate available time slots based on tutor's availability and booked sessions
export function generateAvailableSlots(
  availability: WeeklyAvailability,
  bookedSessions: any[],
  startDate: Date,
  daysAhead: number
): BookingSlot[] {
  const availableSlots: BookingSlot[] = [];
  
  // Generate slots for the given number of days ahead
  for (let i = 0; i < daysAhead; i++) {
    const currentDate = addDays(startDate, i);
    const dayOfWeek = mapDateToDayOfWeek(currentDate);
    
    // Skip if no availability for this day
    if (!availability[dayOfWeek] || availability[dayOfWeek].length === 0) {
      continue;
    }
    
    // For each availability slot in this day
    for (const slot of availability[dayOfWeek]) {
      // Create a booking slot
      const bookingSlot: BookingSlot = {
        tutorId: '', // Will be set by the caller
        day: currentDate,
        start: slot.start,
        end: slot.end,
        available: true
      };
      
      // Check if this slot overlaps with any booked sessions
      const dateString = format(currentDate, 'yyyy-MM-dd');
      const isBooked = bookedSessions.some(session => {
        const sessionDate = format(new Date(session.start_time), 'yyyy-MM-dd');
        const sessionStart = format(new Date(session.start_time), 'HH:mm');
        const sessionEnd = format(new Date(session.end_time), 'HH:mm');
        
        return (
          sessionDate === dateString &&
          ((sessionStart <= slot.start && sessionEnd > slot.start) ||
           (sessionStart < slot.end && sessionEnd >= slot.end) ||
           (sessionStart >= slot.start && sessionEnd <= slot.end))
        );
      });
      
      bookingSlot.available = !isBooked;
      availableSlots.push(bookingSlot);
    }
  }
  
  return availableSlots;
}
