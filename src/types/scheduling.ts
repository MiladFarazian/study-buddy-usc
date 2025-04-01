
// Basic scheduling type definitions
export interface AvailabilitySlot {
  day: string;
  start: string;
  end: string;
}

export interface WeeklyAvailability {
  [day: string]: AvailabilitySlot[];
}

export interface BookingSlot {
  tutorId: string;
  day: Date;
  start: string;
  end: string;
  available: boolean;
}

export interface SessionBooking {
  id: string;
  tutorId: string;
  studentId: string;
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'confirmed' | 'cancelled';
}

// Time slot type for UI components
export interface TimeSlot {
  time: string;
  available: boolean;
}

// Duration option for UI components
export interface DurationOption {
  minutes: number;
  cost: number;
}
