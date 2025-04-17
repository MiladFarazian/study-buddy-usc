import { supabase } from "@/integrations/supabase/client";
import { WeeklyAvailability, WeeklyAvailabilityJson } from "./types/availability";
import { BookingSlot, BookedSession } from "./types/booking";
import { format, addDays, parse, isWithinInterval, parseISO, addMinutes } from 'date-fns';
import { convertTimeToMinutes, convertMinutesToTime } from "./time-utils";

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
      .single();

    if (error || !data) {
      console.error("Error fetching tutor availability:", error);
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
    
    // First, check if a record already exists for this tutor
    const { data: existingData, error: fetchError } = await supabase
      .from('tutor_availability')
      .select('id')
      .eq('tutor_id', tutorId)
      .maybeSingle();
      
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("Error checking for existing tutor availability:", fetchError);
      return false;
    }
    
    let result;
    
    if (existingData) {
      // Update existing record
      result = await supabase
        .from('tutor_availability')
        .update({
          availability: availabilityJson,
          updated_at: new Date().toISOString()
        })
        .eq('tutor_id', tutorId);
    } else {
      // Insert new record
      result = await supabase
        .from('tutor_availability')
        .insert({
          tutor_id: tutorId,
          availability: availabilityJson,
          updated_at: new Date().toISOString()
        });
    }

    if (result.error) {
      console.error("Error updating tutor availability:", result.error);
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
      const startMinutes = convertTimeToMinutes(timeSlot.start);
      const endMinutes = convertTimeToMinutes(timeSlot.end);
      
      // Generate 30-minute slots within the time window
      for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
        const slotStart = convertMinutesToTime(minutes);
        const slotEnd = convertMinutesToTime(minutes + 30);
        
        // Create a slot
        const slot: BookingSlot = {
          day: currentDate,
          start: slotStart,
          end: slotEnd,
          available: true,
          tutorId: ''
        };
        
        // Check if this slot overlaps with any booked session
        bookedSessions.forEach(session => {
          const sessionDate = new Date(session.date);
          
          // Only check sessions on the same day
          if (sessionDate.toDateString() === currentDate.toDateString()) {
            const sessionStartMinutes = convertTimeToMinutes(session.start);
            const sessionEndMinutes = convertTimeToMinutes(session.end);
            
            // Check for overlap
            if (minutes >= sessionStartMinutes && minutes < sessionEndMinutes) {
              slot.available = false;
            }
          }
        });
        
        // Add to available slots
        availableSlots.push(slot);
      }
    });
  }
  
  return availableSlots;
}
