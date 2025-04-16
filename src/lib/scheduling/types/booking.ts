import { Tutor } from '@/types/tutor';

export interface BookingSlot {
  day: Date | string;
  start: string;  // Format: "HH:MM" in 24-hour format
  end: string;    // Format: "HH:MM" in 24-hour format
  available: boolean;
  tutorId: string;
  
  // Optional properties to resolve previous errors
  startTime?: Date;
  endTime?: Date;
  durationMinutes?: number;
  id?: string;
}

export interface BookedSession {
  id: string;
  tutorId: string;
  studentId: string;
  date: string | Date;
  start: string;
  end: string;
  status: string;
}

export interface BookingSession {
  id: string;
  tutor: Tutor;
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  notes?: string;
  courseId?: string;
}
