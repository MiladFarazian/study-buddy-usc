
import { format, parse, addMinutes } from 'date-fns';

// Format a time string (HH:MM) for display
export function formatTimeDisplay(timeString: string): string {
  try {
    const date = parse(timeString, 'HH:mm', new Date());
    return format(date, 'h:mm a');
  } catch (error) {
    console.error(`Error formatting time: ${timeString}`, error);
    return timeString;
  }
}

// Convert time string (HH:MM) to minutes since midnight
export function convertTimeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

// Convert minutes since midnight to time string (HH:MM)
export function convertMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Format date for display
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'EEEE, MMMM d, yyyy');
}

// Format time for display
export function formatTime(time: string | Date): string {
  if (typeof time === 'string' && time.includes(':')) {
    return formatTimeDisplay(time);
  }
  const timeObj = typeof time === 'string' ? new Date(time) : time;
  return format(timeObj, 'h:mm a');
}

// Get day of week name from a date
export function mapDateToDayOfWeek(date: Date): string {
  return format(date, 'EEEE').toLowerCase();
}

// Calculate end time based on start time and duration
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);
  
  const endDate = addMinutes(startDate, durationMinutes);
  return format(endDate, 'HH:mm');
}

// Parse time string to Date object
export function parseTimeString(timeString: string, baseDate?: Date): Date {
  const base = baseDate || new Date();
  const [hours, minutes] = timeString.split(':').map(Number);
  
  const result = new Date(base);
  result.setHours(hours, minutes, 0, 0);
  
  return result;
}
