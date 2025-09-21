import { WeeklyAvailability } from './types/availability';
import { format, parse, addMinutes } from 'date-fns';

/**
 * Validates if a session duration is valid given the selected start time and tutor availability
 */
export function validateDurationAgainstAvailability(
  startTime: string, // Format: "HH:MM" (24-hour)
  durationMinutes: number,
  selectedDate: Date,
  availability: WeeklyAvailability
): boolean {
  if (!availability || !startTime || !selectedDate) {
    return false;
  }

  // Get day name (lowercase)
  const dayName = format(selectedDate, 'EEEE').toLowerCase();
  const daySlots = availability[dayName] || [];

  if (daySlots.length === 0) {
    return false;
  }

  // Calculate end time for the session
  const startDateTime = parse(startTime, 'HH:mm', selectedDate);
  const endDateTime = addMinutes(startDateTime, durationMinutes);
  const endTime = format(endDateTime, 'HH:mm');

  // Check if the session (start + duration) fits within any availability slot
  return daySlots.some(slot => {
    return startTime >= slot.start && endTime <= slot.end;
  });
}

/**
 * Get invalid duration options for a given start time and availability
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