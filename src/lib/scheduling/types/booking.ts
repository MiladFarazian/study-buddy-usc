import { WeeklyAvailability, AvailabilitySlot } from './availability';

// BookingSlot represents a specific time slot for booking
export interface BookingSlot {
  day: Date | string;
  start: string; // Format: "HH:MM" in 24-hour format
  end: string;   // Format: "HH:MM" in 24-hour format
  available: boolean; // Making this required
  tutorId: string; // Make sure tutorId is required
  
  // Additional properties that are used in the application
  startTime?: Date;
  endTime?: Date;
  durationMinutes?: number;
  id?: string;
  courseId?: string | null; // Course number as string or null
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

// Add session type enum
export enum SessionType {
  IN_PERSON = 'in_person',
  VIRTUAL = 'virtual'
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
  sessionType?: SessionType;
  zoomMeetingId?: string;
  zoomJoinUrl?: string;
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
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  sessionType?: SessionType;
  zoomMeetingId?: string;
  zoomJoinUrl?: string;
}

// Re-export Session type from the existing session.ts type file
export type { Session } from '@/types/session';
