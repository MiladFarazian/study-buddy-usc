
import { format, parseISO, addMinutes } from 'date-fns';
import { BookingSlot } from '@/types/scheduling';

// Export booking types
export type { BookingSlot };

// Export from scheduling-utils
export { mapDateToDayOfWeek, getTutorAvailability, getTutorBookedSessions, generateAvailableSlots, createSessionBooking, createPaymentTransaction } from '@/lib/scheduling-utils';

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

// Format date for display (e.g., "Monday, June 1, 2023")
export const formatDateForDisplay = (date: Date): string => {
  return format(date, 'EEEE, MMMM d, yyyy');
};
