
export interface BookingSlot {
  id?: string;
  day: string | Date; // Allow both string and Date for flexibility
  start: string;
  end: string;
  durationMinutes?: number;
  tutorId?: string;
  available?: boolean;
  startTime?: Date;
  endTime?: Date;
}

export interface AvailabilitySlot {
  day: string;
  start: string;
  end: string;
}

// Define WeeklyAvailability as a Record with string keys and arrays of AvailabilitySlot values
export interface WeeklyAvailability {
  [key: string]: AvailabilitySlot[]; // Keys like 'monday', 'tuesday', etc.
}

export type BookingStep = 'select-slot' | 'payment' | 'processing' | 'confirmation';

export interface Session {
  id: string;
  tutor_id: string;
  student_id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: string;
  payment_status: string;
  created_at?: string;
}

export enum CalendarViewMode {
  MONTH = 'month',
  WEEK = 'week',
  DAY = 'day'
}
