
import { supabase } from "@/integrations/supabase/client";
import { BookedSession } from "./types/booking";
import { WeeklyAvailability } from "./types/availability";
import { BookingSlot } from "./types/booking";
import { format, isAfter, isBefore, isSameDay, parse, parseISO, addDays } from "date-fns";
import { mapDateToDayOfWeek } from "./availability-utils";

export async function getTutorBookedSessions(
  tutorId: string,
  startDate: Date,
  endDate: Date
): Promise<BookedSession[]> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('start_time, end_time')
      .eq('tutor_id', tutorId)
      .gte('start_time', startDate.toISOString())
      .lte('end_time', endDate.toISOString())
      .in('status', ['pending', 'confirmed', 'in_progress']);
      
    if (error) throw error;
    
    return (data || []).map(session => ({
      start: new Date(session.start_time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      end: new Date(session.end_time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      date: new Date(session.start_time)
    }));
  } catch (error) {
    console.error("Error fetching booked sessions:", error);
    return [];
  }
}

export function generateAvailableSlots(
  availability: WeeklyAvailability,
  bookedSessions: BookedSession[],
  startDate: Date,
  daysToGenerate: number = 14
): BookingSlot[] {
  const slots: BookingSlot[] = [];
  
  // Generate slots for the specified number of days
  for (let i = 0; i < daysToGenerate; i++) {
    const currentDate = addDays(startDate, i);
    const dayOfWeek = mapDateToDayOfWeek(currentDate);
    const dayAvailability = availability[dayOfWeek] || [];
    
    // Skip days with no availability
    if (dayAvailability.length === 0) continue;
    
    // Find all booked sessions for this day
    const dayBookings = bookedSessions.filter(session => 
      isSameDay(session.date, currentDate)
    );
    
    // For each availability slot on this day
    dayAvailability.forEach(availSlot => {
      // Create time slots in 30-minute increments
      const startHour = parseInt(availSlot.start.split(':')[0]);
      const startMinute = parseInt(availSlot.start.split(':')[1] || '0');
      const endHour = parseInt(availSlot.end.split(':')[0]);
      const endMinute = parseInt(availSlot.end.split(':')[1] || '0');
      
      // Start time in minutes
      let slotStartMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      
      // Generate 30-minute slots
      while (slotStartMinutes < endMinutes) {
        const slotEndMinutes = Math.min(slotStartMinutes + 30, endMinutes);
        
        // Format as HH:MM
        const startTime = `${Math.floor(slotStartMinutes / 60).toString().padStart(2, '0')}:${(slotStartMinutes % 60).toString().padStart(2, '0')}`;
        const endTime = `${Math.floor(slotEndMinutes / 60).toString().padStart(2, '0')}:${(slotEndMinutes % 60).toString().padStart(2, '0')}`;
        
        // Check if this slot overlaps with any booking
        const isBooked = dayBookings.some(booking => {
          const bookingStartMinutes = parseInt(booking.start.split(':')[0]) * 60 + parseInt(booking.start.split(':')[1]);
          const bookingEndMinutes = parseInt(booking.end.split(':')[0]) * 60 + parseInt(booking.end.split(':')[1]);
          
          return (
            (slotStartMinutes >= bookingStartMinutes && slotStartMinutes < bookingEndMinutes) ||
            (slotEndMinutes > bookingStartMinutes && slotEndMinutes <= bookingEndMinutes) ||
            (slotStartMinutes <= bookingStartMinutes && slotEndMinutes >= bookingEndMinutes)
          );
        });
        
        if (!isBooked) {
          slots.push({
            tutorId: '', // Will be filled in by the calling code
            day: currentDate,
            start: startTime,
            end: endTime,
            available: true
          });
        }
        
        // Move to next slot
        slotStartMinutes += 30;
      }
    });
  }
  
  return slots;
}

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
      // Cast to WeeklyAvailability after validation
      const availabilityData = data.availability as any;
      
      // Check if it's a valid object with day properties
      if (typeof availabilityData === 'object' && !Array.isArray(availabilityData)) {
        const cleanAvailability: WeeklyAvailability = {};
        
        // Initialize with empty arrays if undefined
        const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        // Ensure all days exist in the availability object
        weekDays.forEach(day => {
          cleanAvailability[day] = Array.isArray(availabilityData[day]) ? availabilityData[day] : [];
        });
        
        return cleanAvailability;
      }
    }
    
    // If tutor has no availability set yet, return a default structure
    const defaultAvailability: WeeklyAvailability = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    };
    
    return defaultAvailability;
  } catch (error) {
    console.error("Error fetching tutor availability:", error);
    return null;
  }
}

export async function updateTutorAvailability(
  tutorId: string, 
  availability: WeeklyAvailability
): Promise<boolean> {
  try {
    console.log("Updating availability for tutor:", tutorId, availability);
    
    const { error } = await supabase
      .from('profiles')
      .update({ availability: availability as any })
      .eq('id', tutorId);
      
    if (error) {
      console.error("Error updating tutor availability:", error);
      throw error;
    }
    
    console.log("Successfully updated tutor availability");
    return true;
  } catch (error) {
    console.error("Error updating tutor availability:", error);
    return false;
  }
}
