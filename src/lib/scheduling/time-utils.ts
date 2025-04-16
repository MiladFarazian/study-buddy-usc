
import { format, parse, addMinutes, isToday, isTomorrow, addDays, differenceInMinutes } from 'date-fns';

/**
 * Format time for display (e.g., "13:30" to "1:30 PM")
 */
export function formatTimeDisplay(time: string): string {
  if (!time) return '';
  try {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return format(date, 'h:mm a');
  } catch (error) {
    console.error("Error formatting time:", error);
    return time;
  }
}

/**
 * Calculate duration between two time strings
 */
export function calculateDurationMinutes(startTime: string, endTime: string): number {
  try {
    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startDate = new Date(baseDate);
    startDate.setHours(startHour, startMinute, 0, 0);
    
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const endDate = new Date(baseDate);
    endDate.setHours(endHour, endMinute, 0, 0);
    
    // If end time is before start time, assume it's the next day
    if (endDate < startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }
    
    return differenceInMinutes(endDate, startDate);
  } catch (error) {
    console.error("Error calculating duration:", error);
    return 0;
  }
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(dateObj)) {
    return `Today, ${format(dateObj, 'MMM d')}`;
  }
  
  if (isTomorrow(dateObj)) {
    return `Tomorrow, ${format(dateObj, 'MMM d')}`;
  }
  
  return format(dateObj, 'EEEE, MMMM d');
}

/**
 * Format time for display
 */
export function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'h:mm a');
}

/**
 * Generate array of time slots based on interval
 */
export function generateTimeSlots(startHour: number, endHour: number, intervalMinutes: number = 30): string[] {
  const slots: string[] = [];
  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);
  
  let currentTime = new Date(baseDate);
  currentTime.setHours(startHour, 0, 0, 0);
  
  const endTime = new Date(baseDate);
  endTime.setHours(endHour, 0, 0, 0);
  
  while (currentTime < endTime) {
    slots.push(format(currentTime, 'HH:mm'));
    currentTime = addMinutes(currentTime, intervalMinutes);
  }
  
  return slots;
}
