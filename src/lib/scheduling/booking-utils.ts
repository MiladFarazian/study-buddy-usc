
// Utility functions for bookings
import { BookingSlot, BookedSession } from './types/booking';
import { format, parseISO, addMinutes } from 'date-fns';

/**
 * Format a booking slot for display
 */
export function formatBookingSlot(slot: BookingSlot): string {
  const day = slot.day instanceof Date ? format(slot.day, 'EEEE, MMMM d') : 'Unknown date';
  return `${day} from ${slot.start} to ${slot.end}`;
}

/**
 * Calculate duration of a booking slot in minutes
 */
export function calculateSlotDurationMinutes(slot: BookingSlot): number {
  try {
    const startTime = parseISO(`2000-01-01T${slot.start}`);
    const endTime = parseISO(`2000-01-01T${slot.end}`);
    
    const durationMs = endTime.getTime() - startTime.getTime();
    return durationMs / (1000 * 60);
  } catch (err) {
    console.error("Error calculating slot duration:", err);
    return 0;
  }
}

/**
 * Create an end time based on start time and duration in minutes
 */
export function createEndTime(startTime: string, durationMinutes: number): string {
  try {
    const start = parseISO(`2000-01-01T${startTime}`);
    const end = addMinutes(start, durationMinutes);
    return format(end, 'HH:mm');
  } catch (err) {
    console.error("Error creating end time:", err);
    return startTime;
  }
}
