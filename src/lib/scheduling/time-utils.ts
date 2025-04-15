
import { format, addMinutes, parseISO, setMinutes, setHours } from 'date-fns';

// Format a time string from a Date object (HH:MM format)
export function formatTimeString(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'HH:mm');
}

// Parse a time string (HH:MM) into a Date object for the given day
export function parseTimeString(timeString: string, date: Date): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

// Add minutes to a time string (HH:MM) and return a new time string
export function addMinutesToTimeString(timeString: string, minutesToAdd: number): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  const newDate = addMinutes(date, minutesToAdd);
  return format(newDate, 'HH:mm');
}

// Convert a date and time string to an ISO string
export function toISOString(date: Date, timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  const dateTime = new Date(date);
  dateTime.setHours(hours, minutes, 0, 0);
  return dateTime.toISOString();
}

// Get the duration in minutes between two time strings
export function getDurationMinutes(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  
  return endTotalMinutes - startTotalMinutes;
}

// Format time range for display
export function formatTimeRange(startTime: string, endTime: string): string {
  // This would convert time strings like "14:30" to "2:30 PM"
  const start = formatTimeDisplay(startTime);
  const end = formatTimeDisplay(endTime);
  return `${start} - ${end}`;
}

// Format a time string for display (convert 24h format to 12h with AM/PM)
export function formatTimeDisplay(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Convert time string (HH:MM) to minutes since midnight
export function convertTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Convert minutes since midnight to time string (HH:MM)
export function convertMinutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Format date for display
export function formatDate(date: Date): string {
  return format(date, 'EEEE, MMMM d, yyyy');
}

// Format time for display
export function formatTime(timeString: string): string {
  return formatTimeDisplay(timeString);
}
