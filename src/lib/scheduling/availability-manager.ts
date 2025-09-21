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
    // Query the tutors table for availability
    const { data, error } = await supabase
      .from('tutors')
      .select('availability')
      .eq('profile_id', tutorId)
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
    // Validate all time slots are within reasonable hours (6 AM - 11 PM)
    for (const [day, slots] of Object.entries(availability)) {
      for (const slot of slots) {
        const startHour = parseInt(slot.start.split(':')[0]);
        const endHour = parseInt(slot.end.split(':')[0]);
        const endMinute = parseInt(slot.end.split(':')[1]);
        
        if (startHour < 6 || endHour > 23 || (endHour === 23 && endMinute > 0)) {
          console.error(`Invalid time slot: ${slot.start}-${slot.end} on ${day}. Hours must be between 6:00 AM and 11:00 PM.`);
          return false;
        }
      }
    }
    
    // Convert the typed availability to the storage format
    const availabilityJson: WeeklyAvailabilityJson = {};
    
    Object.entries(availability).forEach(([day, slots]) => {
      availabilityJson[day] = slots.map(slot => ({
        day, // Include the day property
        start: slot.start,
        end: slot.end
      }));
    });
    
    // Update the tutors table availability column
    const result = await supabase
      .from('tutors')
      .update({
        availability: availabilityJson,
        updated_at: new Date().toISOString()
      })
      .eq('profile_id', tutorId);

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
 * @deprecated Use generateSmartAvailableSlots from availability-utils.ts instead
 */
export function generateAvailableSlots(
  availability: WeeklyAvailability,
  bookedSessions: BookedSession[],
  startDate: Date,
  daysToGenerate: number
): BookingSlot[] {
  // Import the new function to maintain compatibility
  const { generateSmartAvailableSlots } = require('./availability-utils');
  return generateSmartAvailableSlots(availability, bookedSessions, startDate, daysToGenerate);
}
