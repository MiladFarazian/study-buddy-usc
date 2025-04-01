
import { format, parse } from "date-fns";

// Format time from 24h format to 12h format
export const formatTime = (time: string): string => {
  try {
    const parsedTime = parse(time, "HH:mm", new Date());
    return format(parsedTime, "h:mm a");
  } catch (error) {
    console.error("Error formatting time:", error);
    return time;
  }
};

// Format date to display in the UI
export const formatDate = (date: Date): string => {
  return format(date, "MMMM d, yyyy");
};

// Get day of the week
export const getDayOfWeek = (date: Date): string => {
  return format(date, "EEEE");
};

// Format date for display in calendar
export const formatCalendarDate = (date: Date): string => {
  return format(date, "d");
};
