
import { format } from 'date-fns';

export const useTimeFormatting = () => {
  // Format time from 24h format (HH:MM) to 12h format (h:MM AM/PM)
  const formatTime = (time: string): string => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const date = new Date();
      date.setHours(hours);
      date.setMinutes(minutes);
      return format(date, 'h:mm a');
    } catch (e) {
      console.error('Error formatting time:', e);
      return time;
    }
  };

  // Format date for display (e.g., "Monday, June 1, 2023")
  const formatDateFull = (date: Date): string => {
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  // Format date for display (e.g., "Jun 1, 2023")
  const formatDateShort = (date: Date): string => {
    return format(date, 'MMM d, yyyy');
  };

  return {
    formatTime,
    formatDateFull,
    formatDateShort
  };
};
