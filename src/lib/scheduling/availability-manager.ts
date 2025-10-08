import { supabase } from "@/integrations/supabase/client";
import { WeeklyAvailability, WeeklyAvailabilityJson } from "./types/availability";
import { BookingSlot, BookedSession } from "./types/booking";
import { format, addDays, parse, isWithinInterval, parseISO, addMinutes, startOfWeek } from 'date-fns';
import { convertTimeToMinutes, convertMinutesToTime } from "./time-utils";

/**
 * Fetch the tutor's availability settings
 */
export async function getTutorAvailability(tutorId: string): Promise<WeeklyAvailability | null> {
  try {
    // First check if tutor is approved
    const { data: tutorProfile, error: profileError } = await supabase
      .from('profiles')
      .select('approved_tutor')
      .eq('id', tutorId)
      .eq('role', 'tutor')
      .single();

    if (profileError || !tutorProfile?.approved_tutor) {
      console.log("Tutor not found or not approved:", tutorId);
      return null;
    }

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
 */
export async function generateAvailableSlots(
  availability: WeeklyAvailability,
  bookedSessions: BookedSession[],
  startDate: Date,
  daysToGenerate: number,
  tutorId?: string
): Promise<BookingSlot[]> {
  const availableSlots: BookingSlot[] = [];
  const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const now = new Date();
  const bufferTime = addMinutes(now, 180); // 3-hour minimum booking buffer
  
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
      
      // Skip time slots outside reasonable hours (6 AM - 11 PM)
      const startHour = Math.floor(startMinutes / 60);
      const endHour = Math.floor(endMinutes / 60);
      if (startHour < 6 || endHour > 23) {
        return; // Skip this time slot
      }
      
      // Generate 30-minute slots within the time window
      for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
        const slotStart = convertMinutesToTime(minutes);
        const slotEnd = convertMinutesToTime(minutes + 30);
        
        // Create slot date/time for comparison
        const slotStartTime = parse(slotStart, 'HH:mm', currentDate);
        
        // Skip if slot is in the past (including 3-hour buffer)
        if (slotStartTime <= bufferTime) {
          continue;
        }
        
        // Create a slot
        const slot: BookingSlot = {
          day: currentDate,
          start: slotStart,
          end: slotEnd,
          available: true,
          tutorId: tutorId || ''
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
  
  // If tutorId is provided, check weekly session limits
  if (tutorId) {
    const { isTutorAtWeeklyLimit } = await import('./session-limit-utils');
    
    // Group slots by week and check limits
    const weeksToCheck = new Set<string>();
    availableSlots.forEach(slot => {
      const weekKey = startOfWeek(slot.day, { weekStartsOn: 0 }).toISOString();
      weeksToCheck.add(weekKey);
    });
    
    // Check each week's limit
    const weekLimitMap = new Map<string, boolean>();
    for (const weekKey of weeksToCheck) {
      const weekDate = new Date(weekKey);
      const atLimit = await isTutorAtWeeklyLimit(tutorId, weekDate);
      weekLimitMap.set(weekKey, atLimit);
    }
    
    // Mark slots in weeks at limit as unavailable
    availableSlots.forEach(slot => {
      const weekKey = startOfWeek(slot.day, { weekStartsOn: 0 }).toISOString();
      if (weekLimitMap.get(weekKey)) {
        slot.available = false;
      }
    });
  }
  
  return availableSlots;
}
