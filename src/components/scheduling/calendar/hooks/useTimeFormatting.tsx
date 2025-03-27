
import { format } from 'date-fns';

// Helper function to convert HH:MM to minutes
export const convertTimeToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// Format the time in HH:MM format
export const formatTimeString = (hour: number, minute: number): string => {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

// Helper to check if one time is before another
export const isTimeBefore = (time1: string, time2: string): boolean => {
  return convertTimeToMinutes(time1) < convertTimeToMinutes(time2);
};

// Get a time string 15 minutes later
export const addFifteenMinutes = (timeString: string): string => {
  let [hours, minutes] = timeString.split(':').map(Number);
  
  minutes += 15;
  if (minutes >= 60) {
    hours += 1;
    minutes -= 60;
  }
  
  return formatTimeString(hours, minutes);
};

// Format a date to string
export const formatDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};
