
import { format, parse, isValid } from 'date-fns';

/**
 * Format time display from 24-hour format to 12-hour format
 */
export function formatTimeDisplay(time24h: string): string {
  try {
    const [hours, minutes] = time24h.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes)) {
      return time24h;
    }
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch (err) {
    console.error("Error formatting time display:", err);
    return time24h;
  }
}

/**
 * Convert time string to minutes
 */
export function convertTimeToMinutes(time: string): number {
  try {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  } catch (err) {
    console.error("Error converting time to minutes:", err);
    return 0;
  }
}

/**
 * Convert minutes to time string in 24-hour format
 */
export function convertMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Format a date object to a human-readable string
 */
export function formatDate(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return isValid(dateObj) ? format(dateObj, 'EEEE, MMMM d, yyyy') : 'Invalid date';
  } catch (err) {
    console.error("Error formatting date:", err);
    return 'Invalid date';
  }
}

/**
 * Format a time string to a human-readable format
 */
export function formatTime(time: string): string {
  try {
    if (time.includes('T')) {
      // If time is a full ISO string
      const dateObj = new Date(time);
      return isValid(dateObj) ? format(dateObj, 'h:mm a') : formatTimeDisplay(time);
    } else {
      // If time is in HH:MM format
      return formatTimeDisplay(time);
    }
  } catch (err) {
    console.error("Error formatting time:", err);
    return time;
  }
}

/**
 * Parse a time string (HH:MM) to a Date object
 */
export function parseTimeString(timeStr: string, baseDate?: Date): Date | null {
  try {
    const date = baseDate || new Date();
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes)) {
      return null;
    }
    
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    
    return result;
  } catch (err) {
    console.error("Error parsing time string:", err);
    return null;
  }
}
