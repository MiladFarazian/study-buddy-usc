
import { format, parse } from 'date-fns';

/**
 * Convert time string from 24-hour format to 12-hour format
 * @param time24 Time in 24-hour format (HH:MM)
 * @returns Time in 12-hour format (h:mm a)
 */
export const formatTimeDisplay = (time24: string): string => {
  const timeObj = parse(time24, 'HH:mm', new Date());
  return format(timeObj, 'h:mm a');
};

/**
 * Convert time string from 12-hour format to 24-hour format
 * @param time12 Time in 12-hour format (h:mm a)
 * @returns Time in 24-hour format (HH:MM)
 */
export const convertTo24Hour = (time12: string): string => {
  const timeObj = parse(time12, 'h:mm a', new Date());
  return format(timeObj, 'HH:mm');
};

/**
 * Convert time string to minutes since midnight
 * @param timeStr Time in 24-hour format (HH:MM)
 * @returns Minutes since midnight
 */
export const convertTimeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convert minutes since midnight to time string
 * @param totalMinutes Minutes since midnight
 * @returns Time in 24-hour format (HH:MM)
 */
export const convertMinutesToTime = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};
