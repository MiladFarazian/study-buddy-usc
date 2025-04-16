
// Export types
export * from './types/booking';
export * from './types/availability';
export * from './types';

// Export managers
export * from './availability-manager';
export * from './session-manager';

// Export utility functions
export * from './time-utils';
export * from './email-utils';
export * from './payment-utils';

// Re-export UI components
export * from './ui/BookingSummary';
export * from './ui/DateSelector';
export * from './ui/DurationSelector';
export * from './ui/TimeSelector';

// Export the booking utils with explicit naming to avoid conflicts
import * as bookingUtils from './booking-utils';

// Re-export specific functions from booking-utils
export { 
  createPaymentTransaction,
  createPaymentIntent,
  processPaymentForSession,
  createSessionBooking
} from './booking-utils';

// Explicitly export mapDateToDayOfWeek from time-utils
export { mapDateToDayOfWeek } from './time-utils';

// Export utility functions used in TimeSlotSelectionStep
export { 
  convertTimeToMinutes, 
  convertMinutesToTime 
} from './time-utils';

// Export BookingUtils namespace for backward compatibility
export { bookingUtils as BookingUtils };
