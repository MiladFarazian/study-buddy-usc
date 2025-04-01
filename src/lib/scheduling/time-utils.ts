
import { format, parseISO, addMinutes, isValid, parse } from "date-fns";

// Format time from 24-hour format to 12-hour format
export function formatTime(time: string): string {
  try {
    // For time strings like "14:30"
    if (time.includes(':')) {
      const [hours, minutes] = time.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return format(date, "h:mm a");
    }
    
    // For ISO strings
    const date = parseISO(time);
    if (isValid(date)) {
      return format(date, "h:mm a");
    }
    
    return time;
  } catch (error) {
    console.error("Error formatting time:", error);
    return time;
  }
}

// Alias for formatTime for consistent naming
export function formatTimeDisplay(time: string): string {
  return formatTime(time);
}

// Format date to a readable string
export function formatDate(date: Date | null): string {
  if (!date) return "";
  return format(date, "EEEE, MMMM d, yyyy");
}

// Format duration minutes to a readable string
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`;
  } else if (minutes === 60) {
    return "1 hour";
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
    }
  }
}

// Calculate end time based on start time and duration in minutes
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  try {
    // For ISO strings (full dates)
    if (startTime.includes('T')) {
      const startDate = parseISO(startTime);
      const endDate = addMinutes(startDate, durationMinutes);
      return endDate.toISOString();
    }
    
    // For time strings like "14:30"
    if (startTime.includes(':')) {
      const [hours, minutes] = startTime.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      const endDate = addMinutes(date, durationMinutes);
      return format(endDate, "HH:mm");
    }
    
    return startTime;
  } catch (error) {
    console.error("Error calculating end time:", error);
    return startTime;
  }
}

// Format price as currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// Convert time in "HH:MM" format to minutes since midnight
export function convertTimeToMinutes(time: string): number {
  try {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  } catch (error) {
    console.error("Error converting time to minutes:", error);
    return 0;
  }
}

// Convert minutes since midnight to "HH:MM" format
export function convertMinutesToTime(minutes: number): string {
  try {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error("Error converting minutes to time:", error);
    return "00:00";
  }
}

// Format time string with proper padding
export function formatTimeString(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

// Parse a time string to get hours and minutes
export function parseTimeString(timeStr: string): { hour: number; minute: number } {
  const [hourStr, minuteStr] = timeStr.split(':');
  return {
    hour: parseInt(hourStr, 10),
    minute: parseInt(minuteStr, 10)
  };
}

