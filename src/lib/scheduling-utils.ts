
// This file is kept for backward compatibility
// Import and re-export everything from the new module structure
export * from './scheduling/index';

// Adding missing exports for backward compatibility
import { BookingSlot, WeeklyAvailability } from './scheduling/types';
import { getTutorAvailability, mapDateToDayOfWeek } from './scheduling/availability-utils';

// Re-implement or re-export these functions
export const getTutorBookedSessions = async (tutorId: string, startDate: Date, endDate: Date) => {
  const { getTutorBookedSessions } = await import('./scheduling/booking-utils');
  return getTutorBookedSessions(tutorId, startDate, endDate);
};

export const generateAvailableSlots = (
  availability: WeeklyAvailability,
  bookedSessions: any[],
  startDate: Date,
  daysAhead: number
): BookingSlot[] => {
  // Lazy-load the implementation from the new module
  const { generateAvailableSlots } = require('./scheduling/availability-utils');
  return generateAvailableSlots(availability, bookedSessions, startDate, daysAhead);
};
