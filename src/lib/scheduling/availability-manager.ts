
import { WeeklyAvailability, AvailabilitySlot, WeeklyAvailabilityJson } from './types/availability';
import { BookedSession } from './types/booking';
import { format, parseISO, isEqual, addDays, startOfDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

// Get a tutor's availability settings
export async function getTutorAvailability(tutorId: string): Promise<WeeklyAvailability | null> {
  try {
    const { data, error } = await supabase
      .from('tutor_availability')
      .select('availability')
      .eq('tutor_id', tutorId)
      .single();
      
    if (error) {
      console.error('Error fetching tutor availability:', error);
      return null;
    }
    
    // Cast to WeeklyAvailability with proper typing
    return data?.availability as unknown as WeeklyAvailability || null;
  } catch (error) {
    console.error('Error in getTutorAvailability:', error);
    return null;
  }
}

// Update a tutor's availability settings
export async function updateTutorAvailability(tutorId: string, availability: WeeklyAvailability): Promise<boolean> {
  try {
    // Convert WeeklyAvailability to a JSON object for database storage
    const availabilityJson = availability as unknown as WeeklyAvailabilityJson;
    
    const { error } = await supabase
      .from('tutor_availability')
      .upsert({ 
        tutor_id: tutorId, 
        availability: availabilityJson 
      }, { onConflict: 'tutor_id' });
      
    if (error) {
      console.error('Error updating tutor availability:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateTutorAvailability:', error);
    return false;
  }
}

// Generate available slots based on tutor's availability and existing bookings
export function generateAvailableSlots(
  availability: WeeklyAvailability,
  bookedSessions: BookedSession[],
  startDate: Date,
  daysToGenerate: number
) {
  const availableSlots = [];
  const today = startOfDay(new Date());
  
  // Generate slots for the specified number of days
  for (let i = 0; i < daysToGenerate; i++) {
    const currentDate = addDays(startDate, i);
    const dayOfWeek = format(currentDate, 'EEEE').toLowerCase();
    
    // Skip days with no availability
    if (!availability[dayOfWeek] || !Array.isArray(availability[dayOfWeek]) || availability[dayOfWeek].length === 0) {
      continue;
    }
    
    // Process each availability slot for the current day
    for (const slot of availability[dayOfWeek]) {
      const [startHour, startMinute] = slot.start.split(':').map(Number);
      const [endHour, endMinute] = slot.end.split(':').map(Number);
      
      // Create 30-minute interval slots
      for (let hour = startHour; hour < endHour || (hour === endHour && startMinute < endMinute); hour++) {
        for (let minute = (hour === startHour ? startMinute : 0); minute < 60; minute += 30) {
          // Skip if we've gone past the end time
          if (hour > endHour || (hour === endHour && minute >= endMinute)) {
            break;
          }
          
          const slotStart = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const slotEndMinutes = (minute + 30) % 60;
          const slotEndHour = (minute + 30 >= 60) ? hour + 1 : hour;
          const slotEnd = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMinutes.toString().padStart(2, '0')}`;
          
          // Check if this slot overlaps with any booked sessions
          let isAvailable = true;
          for (const bookedSession of bookedSessions) {
            const sessionDate = new Date(bookedSession.date);
            
            // Only check sessions on the same day
            if (isEqual(startOfDay(sessionDate), startOfDay(currentDate))) {
              const sessionStart = bookedSession.start;
              const sessionEnd = bookedSession.end;
              
              // Check for overlap
              if (
                (slotStart >= sessionStart && slotStart < sessionEnd) ||
                (slotEnd > sessionStart && slotEnd <= sessionEnd) ||
                (slotStart <= sessionStart && slotEnd >= sessionEnd)
              ) {
                isAvailable = false;
                break;
              }
            }
          }
          
          // Add available slots to the result
          if (isAvailable) {
            availableSlots.push({
              day: new Date(currentDate),
              start: slotStart,
              end: slotEnd,
              available: isAvailable,
              tutorId: ''  // This will be filled in by the calling function
            });
          }
        }
      }
    }
  }
  
  return availableSlots;
}
