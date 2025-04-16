
import { format, parse, addMinutes } from 'date-fns';

/**
 * Format time from 24-hour format to AM/PM display
 */
export function formatTimeDisplay(time: string): string {
  try {
    // Parse the time string to a Date object
    const timeDate = parse(time, 'HH:mm', new Date());
    // Format to AM/PM display
    return format(timeDate, 'h:mm a');
  } catch (error) {
    console.error("Error formatting time:", error);
    return time;
  }
}

/**
 * Generate time slots for a day based on interval
 */
export function generateTimeSlots(startHour: number = 8, endHour: number = 22, intervalMinutes: number = 30): string[] {
  const slots: string[] = [];
  const today = new Date();
  
  // Set to startHour:00
  today.setHours(startHour, 0, 0, 0);
  
  // Loop until endHour:00
  while (today.getHours() < endHour) {
    slots.push(format(today, 'HH:mm'));
    today.setTime(today.getTime() + intervalMinutes * 60 * 1000);
  }
  
  return slots;
}

/**
 * Check if a time is within a given range
 */
export function isTimeInRange(time: string, startTime: string, endTime: string): boolean {
  return time >= startTime && time < endTime;
}
