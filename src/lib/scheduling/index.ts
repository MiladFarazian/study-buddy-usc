
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

// Export the booking utils but rename conflicting functions
// to avoid ambiguity with session-manager exports
import * as bookingUtils from './booking-utils';
export { 
  createPaymentTransaction,
  createPaymentIntent,
  processPaymentForSession
} from './booking-utils';

// Explicitly re-export other functions to avoid conflicts
export { 
  bookingUtils as BookingUtils,
  mapDateToDayOfWeek 
} from './time-utils';
