
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

// Add Session type if needed
export interface Session {
  id: string;
  tutor_id: string;
  student_id: string;
  start_time: string;
  end_time: string;
  status: string;
  payment_status: string;
  course_id?: string | null;
  location?: string | null;
  notes?: string | null;
}
