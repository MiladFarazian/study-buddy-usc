
export type BookedSession = {
  start: string;
  end: string;
  date: Date;
};

export type BookingSlot = {
  tutorId: string;
  day: Date;
  start: string;
  end: string;
  available: boolean;
};

export type SessionCreationParams = {
  studentId: string;
  tutorId: string;
  courseId: string | null;
  startTime: string;
  endTime: string;
  location: string | null;
  notes: string | null;
};
