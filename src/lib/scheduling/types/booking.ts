
import { WeeklyAvailability, AvailabilitySlot } from './availability';

// BookingSlot represents a specific time slot for booking
export interface BookingSlot {
  day: Date | string;
  start: string; // Format: "HH:MM" in 24-hour format
  end: string;   // Format: "HH:MM" in 24-hour format
  available: boolean;
  tutorId: string; // Make sure tutorId is required
}

// BookedSession represents an already booked session
export interface BookedSession {
  id: string;
  date: Date;
  start: string; // Format: "HH:MM"
  end: string;   // Format: "HH:MM"
  tutorId: string;
  studentId: string;
}

// Session creation parameters
export interface SessionCreationParams {
  studentId: string;
  tutorId: string;
  courseId: string | null;
  startTime: string;
  endTime: string;
  location: string | null;
  notes: string | null;
}

// Session details response
export interface SessionDetails {
  id: string;
  studentId: string;
  tutorId: string;
  courseId?: string;
  startTime: string;
  endTime: string;
  location?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus?: 'unpaid' | 'paid' | 'refunded';
}
