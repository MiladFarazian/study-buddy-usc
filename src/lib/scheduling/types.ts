
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
