
// This file re-exports the types from the structured files for backward compatibility
export * from './types/availability';
export * from './types/booking';

// Legacy types kept for backward compatibility
export const CalendarViewMode = {
  MONTH: 'month',
  WEEK: 'week',
  DAY: 'day'
} as const;

export type CalendarViewMode = typeof CalendarViewMode[keyof typeof CalendarViewMode];
