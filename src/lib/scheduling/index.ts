
// Export all scheduling functionality from the module
export * from './availability-manager';
export * from './booking-manager';
export * from './types/availability';
export * from './types/booking';
export * from './time-utils';
export * from './availability-utils';
export * from './booking-utils';
export * from './session-manager';

// Export UI components
export { DateSelector } from './ui/DateSelector';
export { TimeSelector } from './ui/TimeSelector';
export { DurationSelector } from './ui/DurationSelector';
export { BookingSummary } from './ui/BookingSummary';

// Add the mapDateToDayOfWeek function
export function mapDateToDayOfWeek(date: Date): number {
  // JavaScript's getDay() returns 0 for Sunday, but we want 0 for Monday
  const day = date.getDay();
  // Convert to 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
  return day === 0 ? 6 : day - 1;
}
