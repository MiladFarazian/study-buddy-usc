
// Common types for scheduling functionality
export type AvailabilitySlot = {
  day: string;
  start: string;
  end: string;
};

export type WeeklyAvailability = {
  [key: string]: AvailabilitySlot[];
};

export type BookingSlot = {
  tutorId: string;
  day: Date;
  start: string;
  end: string;
  available: boolean;
};

export type Session = {
  id: string;
  tutorId: string;
  studentId: string;
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
};

export type BookingFormData = {
  date: Date | null;
  time: string | null;
  duration: number;
  notes?: string;
};

export type TimeSlot = {
  time: string; // Format: "HH:mm" (24-hour)
  available: boolean;
};

export type CalendarViewMode = 'week' | 'month';
