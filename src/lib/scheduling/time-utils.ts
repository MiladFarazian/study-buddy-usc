
import { format, parse, parseISO } from 'date-fns';

/**
 * Convert time string (HH:MM) to minutes since start of day
 */
export function convertTimeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since start of day back to time string (HH:MM)
 */
export function convertMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Format time display for UI (e.g., "14:00" to "2:00 PM")
 */
export function formatTimeDisplay(timeString: string): string {
  try {
    // Parse the time string as a date
    const time = parse(timeString, 'HH:mm', new Date());
    return format(time, 'h:mm a');
  } catch (error) {
    console.error('Error formatting time display:', error);
    return timeString;
  }
}

/**
 * Format a date (e.g., "Apr 12, 2025")
 */
export function formatDate(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return typeof date === 'string' ? date : date.toLocaleDateString();
  }
}

/**
 * Format time (e.g., "2:30 PM")
 */
export function formatTime(time: string): string {
  return formatTimeDisplay(time);
}

/**
 * Calculate duration in minutes between two time strings
 */
export function calculateDurationMinutes(start: string, end: string): number {
  return convertTimeToMinutes(end) - convertTimeToMinutes(start);
}

/**
 * Add minutes to a time string
 */
export function addMinutesToTime(time: string, minutes: number): string {
  const timeInMinutes = convertTimeToMinutes(time);
  return convertMinutesToTime(timeInMinutes + minutes);
}

/**
 * Map date to day of week string (e.g., "monday", "tuesday")
 */
export function mapDateToDayOfWeek(date: Date): string {
  const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return weekDays[date.getDay()];
}
