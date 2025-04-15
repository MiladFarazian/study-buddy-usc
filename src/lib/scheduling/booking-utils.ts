
// This file provides backward compatibility for components that still import from it
import { createSessionBooking, bookSession } from './booking-manager';
import { getTutorAvailability, updateTutorAvailability } from './availability-manager';
import { getTutorUpcomingSessions, getStudentUpcomingSessions } from './session-manager';

// Re-export everything for backward compatibility
export {
  createSessionBooking,
  bookSession,
  getTutorAvailability,
  updateTutorAvailability,
  getTutorUpcomingSessions,
  getStudentUpcomingSessions
};
