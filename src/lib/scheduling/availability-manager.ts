
import { supabase } from "@/integrations/supabase/client";
import { WeeklyAvailability, WeeklyAvailabilityJson } from "./types/availability";
import { BookingSlot, BookedSession } from "./types/booking";
import { format, addDays, parse, isWithinInterval, parseISO } from 'date-fns';

/**
 * Fetch the tutor's availability settings
 */
export async function getTutorAvailability(tutorId: string): Promise<WeeklyAvailability | null> {
  try {
    // Query the database for tutor availability
    const { data, error } = await supabase
      .from('tutor_availability')
      .select('*')
      .eq('tutor_id', tutorId)
      .maybeSingle(); // Use maybeSingle instead of single to allow for no rows

    if (error) {
      console.error("Error fetching tutor availability:", error);
      return null;
    }

    // If no data exists, create a default availability record
    if (!data) {
      console.log("No availability record found for tutor. Creating default record.");
      const defaultAvailability = createDefaultAvailability();
      const success = await updateTutorAvailability(tutorId, defaultAvailability);
      if (success) {
        return defaultAvailability;
      }
      return null;
    }
    
    // Parse the availability JSON safely
    const availabilityData = data.availability as WeeklyAvailabilityJson;
    if (!availabilityData) return null;
    
    // Convert the JSON to our proper type with day property
    const weeklyAvailability: WeeklyAvailability = {};
    Object.entries(availabilityData).forEach(([day, slots]) => {
      weeklyAvailability[day] = slots.map(slot => ({
        day,
        start: slot.start,
        end: slot.end
      }));
    });
    
    return weeklyAvailability;
  } catch (err) {
    console.error("Failed to fetch tutor availability:", err);
    return null;
  }
}

/**
 * Create a default availability schedule
 */
function createDefaultAvailability(): WeeklyAvailability {
  return {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  };
}

/**
 * Update a tutor's availability settings
 */
export async function updateTutorAvailability(tutorId: string, availability: WeeklyAvailability): Promise<boolean> {
  try {
    // Convert the typed availability to the storage format
    const availabilityJson: WeeklyAvailabilityJson = {};
    
    Object.entries(availability).forEach(([day, slots]) => {
      availabilityJson[day] = slots.map(slot => ({
        day, // Include the day property
        start: slot.start,
        end: slot.end
      }));
    });
    
    const { error } = await supabase
      .from('tutor_availability')
      .upsert({
        tutor_id: tutorId,
        availability: availabilityJson,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error("Error updating tutor availability:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Failed to update tutor availability:", err);
    return false;
  }
}

/**
 * Generate available booking slots based on tutor's availability and booked sessions
 */
export function generateAvailableSlots(
  availability: WeeklyAvailability,
  bookedSessions: BookedSession[],
  startDate: Date,
  daysToGenerate: number
): BookingSlot[] {
  const availableSlots: BookingSlot[] = [];
  const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  // Generate slots for the specified number of days
  for (let i = 0; i < daysToGenerate; i++) {
    const currentDate = addDays(startDate, i);
    const dayOfWeek = weekDays[currentDate.getDay()];
    
    // Get available time slots for this day of the week
    const dayAvailability = availability[dayOfWeek] || [];
    
    // For each available time slot in the day
    dayAvailability.forEach(timeSlot => {
      // Create a slot
      const slot: BookingSlot = {
        day: currentDate,
        start: timeSlot.start,
        end: timeSlot.end,
        available: true,
        tutorId: ''
      };
      
      // Check if this slot overlaps with any booked session
      bookedSessions.forEach(session => {
        const sessionDate = new Date(session.date);
        
        // Only check sessions on the same day
        if (sessionDate.toDateString() === currentDate.toDateString()) {
          const sessionStartTime = session.start;
          const sessionEndTime = session.end;
          
          // Check for overlap
          if (
            (slot.start >= sessionStartTime && slot.start < sessionEndTime) ||
            (slot.end > sessionStartTime && slot.end <= sessionEndTime) ||
            (slot.start <= sessionStartTime && slot.end >= sessionEndTime)
          ) {
            // This slot is not available
            slot.available = false;
          }
        }
      });
      
      // Add to available slots
      availableSlots.push(slot);
    });
  }
  
  return availableSlots;
}
