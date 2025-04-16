
import { supabase } from "@/integrations/supabase/client";
import { WeeklyAvailability, WeeklyAvailabilityJson } from "./types/availability";
import { BookingSlot, BookedSession } from "./types/booking";
import { format, addDays, parse, isWithinInterval, parseISO } from 'date-fns';

/**
 * Fetch the tutor's availability settings
 */
export async function getTutorAvailability(tutorId: string): Promise<WeeklyAvailability | null> {
  try {
    console.log(`Fetching availability for tutor: ${tutorId}`);
    
    // Query the database for tutor availability
    const { data, error } = await supabase
      .from('tutor_availability')
      .select('*')
      .eq('tutor_id', tutorId)
      .single();

    if (error) {
      console.error("Error fetching tutor availability:", error);
      return null;
    }

    if (!data || !data.availability) {
      console.log(`No availability data found for tutor: ${tutorId}`);
      return null;
    }

    // Parse the availability JSON safely
    const availabilityData = data.availability as WeeklyAvailabilityJson;
    
    // Convert the JSON to our proper type with day property
    const weeklyAvailability: WeeklyAvailability = {};
    Object.entries(availabilityData).forEach(([day, slots]) => {
      if (Array.isArray(slots)) {
        weeklyAvailability[day] = slots.map(slot => ({
          day,
          start: slot.start,
          end: slot.end
        }));
      } else {
        weeklyAvailability[day] = [];
      }
    });
    
    console.log(`Successfully fetched availability for tutor: ${tutorId}`);
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
    console.log(`Updating availability for tutor: ${tutorId}`);
    
    // Convert the typed availability to the storage format
    const availabilityJson: WeeklyAvailabilityJson = {};
    
    Object.entries(availability).forEach(([day, slots]) => {
      availabilityJson[day] = slots.map(slot => ({
        start: slot.start,
        end: slot.end,
        day
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

    console.log(`Successfully updated availability for tutor: ${tutorId}`);
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
  
  console.log(`Generating slots for ${daysToGenerate} days starting from ${startDate.toISOString()}`);
  console.log(`Received ${bookedSessions.length} booked sessions to check against`);
  
  // Generate slots for the specified number of days
  for (let i = 0; i < daysToGenerate; i++) {
    const currentDate = addDays(startDate, i);
    const dayOfWeek = weekDays[currentDate.getDay()];
    
    // Get available time slots for this day of the week
    const dayAvailability = availability[dayOfWeek] || [];
    
    console.log(`Day ${format(currentDate, 'yyyy-MM-dd')} (${dayOfWeek}) has ${dayAvailability.length} availability slots`);
    
    // For each available time slot in the day
    dayAvailability.forEach(timeSlot => {
      // Create a slot
      const slot: BookingSlot = {
        day: new Date(currentDate),
        start: timeSlot.start,
        end: timeSlot.end,
        available: true,
        tutorId: '',
        durationMinutes: 30 // Default to 30 minutes
      };
      
      // Calculate duration in minutes
      const startParts = timeSlot.start.split(':').map(Number);
      const endParts = timeSlot.end.split(':').map(Number);
      const startMinutes = startParts[0] * 60 + startParts[1];
      const endMinutes = endParts[0] * 60 + endParts[1];
      slot.durationMinutes = endMinutes - startMinutes;
      
      // Check if this slot overlaps with any booked session
      bookedSessions.forEach(session => {
        if (!(session.date instanceof Date)) {
          session.date = new Date(session.date);
        }
        
        // Only check sessions on the same day
        if (session.date.toDateString() === currentDate.toDateString()) {
          // Check for overlap
          if (
            (slot.start >= session.start && slot.start < session.end) ||
            (slot.end > session.start && slot.end <= session.end) ||
            (slot.start <= session.start && slot.end >= session.end)
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
  
  console.log(`Generated ${availableSlots.length} slots in total, ${availableSlots.filter(s => s.available).length} are available`);
  return availableSlots;
}

/**
 * Break up availability into 30-minute slots
 */
export function breakIntoThirtyMinuteSlots(availability: WeeklyAvailability): WeeklyAvailability {
  const result: WeeklyAvailability = {};
  
  Object.entries(availability).forEach(([day, slots]) => {
    result[day] = [];
    
    slots.forEach(slot => {
      const startParts = slot.start.split(':').map(Number);
      const endParts = slot.end.split(':').map(Number);
      
      // Convert to minutes
      let startMinutes = startParts[0] * 60 + startParts[1];
      const endMinutes = endParts[0] * 60 + endParts[1];
      
      // Create 30-minute slots
      while (startMinutes + 30 <= endMinutes) {
        const slotStartHour = Math.floor(startMinutes / 60);
        const slotStartMinute = startMinutes % 60;
        
        const slotEndHour = Math.floor((startMinutes + 30) / 60);
        const slotEndMinute = (startMinutes + 30) % 60;
        
        result[day].push({
          day,
          start: `${slotStartHour.toString().padStart(2, '0')}:${slotStartMinute.toString().padStart(2, '0')}`,
          end: `${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute.toString().padStart(2, '0')}`
        });
        
        // Move to next slot
        startMinutes += 30;
      }
    });
  });
  
  return result;
}
