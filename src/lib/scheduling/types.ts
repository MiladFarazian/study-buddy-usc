
export interface BookingSlot {
  id?: string;
  day: string;
  start: string;
  end: string;
  durationMinutes?: number;
  tutorId?: string;
  available?: boolean;
  startTime?: Date;
  endTime?: Date;
}

export type BookingStep = 'select-slot' | 'payment' | 'processing';
