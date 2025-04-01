
// Basic scheduling type definitions
// These will be expanded upon as we rebuild the scheduling system

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
