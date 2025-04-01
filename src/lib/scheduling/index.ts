
import { format, parseISO, addMinutes } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Session } from "@/types/session";
import { BookingSlot, SessionBooking } from "@/types/scheduling";

// Export booking types
export type { BookingSlot };

// Re-export UI components
export { DateSelector } from './ui/DateSelector';
export { TimeSelector } from './ui/TimeSelector';
export { DurationSelector } from './ui/DurationSelector';
export { BookingSummary } from './ui/BookingSummary';
export { ScheduleCalendar } from './ui/ScheduleCalendar';

// Helper function to convert time string to minutes
export const convertTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper function to convert minutes to time string
export const convertMinutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

// Helper function to get formatted time (12-hour format with AM/PM)
export const getFormattedTime = (timeStr: string): string => {
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
  } catch (e) {
    console.error('Error formatting time:', e);
    return timeStr;
  }
};

// Function to map a Date to day of week string
export const mapDateToDayOfWeek = (date: Date): string => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

// Format date for display (e.g., "Monday, June 1, 2023")
export const formatDateForDisplay = (date: Date): string => {
  return format(date, 'EEEE, MMMM d, yyyy');
};
