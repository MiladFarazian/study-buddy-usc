import { WeeklyAvailability } from './types/availability';
import { convertTimeToMinutes, convertMinutesToTime, mapDateToDayOfWeek } from './time-utils';

/**
 * Validates if a session duration would extend beyond tutor's available hours
 */
export function validateDurationAgainstAvailability(
  startTime: string,
  durationMinutes: number,
  selectedDate: Date,
  availability: WeeklyAvailability
): boolean {
  // Get the day of week for the selected date
  const dayName = mapDateToDayOfWeek(selectedDate);
  const daySlots = availability[dayName] || [];
  
  if (daySlots.length === 0) {
    return false; // No availability for this day
  }
  
  // Calculate when the session would end
  const startMinutes = convertTimeToMinutes(startTime);
  const endMinutes = startMinutes + durationMinutes;
  const endTime = convertMinutesToTime(endMinutes);
  
  // Check if the session fits within any of the tutor's available time slots for that day
  return daySlots.some(slot => {
    const slotStartMinutes = convertTimeToMinutes(slot.start);
    const slotEndMinutes = convertTimeToMinutes(slot.end);
    
    return startMinutes >= slotStartMinutes && endMinutes <= slotEndMinutes;
  });
}

/**
 * Returns a list of invalid durations for a given start time and date
 */
export function getInvalidDurations(
  startTime: string,
  selectedDate: Date,
  availability: WeeklyAvailability,
  durationOptions: number[]
): number[] {
  return durationOptions.filter(duration => 
    !validateDurationAgainstAvailability(startTime, duration, selectedDate, availability)
  );
}

/**
 * Returns a list of valid durations for a given start time and date
 */
export function getValidDurations(
  startTime: string,
  selectedDate: Date,
  availability: WeeklyAvailability,
  durationOptions: number[]
): number[] {
  return durationOptions.filter(duration => 
    validateDurationAgainstAvailability(startTime, duration, selectedDate, availability)
  );
}