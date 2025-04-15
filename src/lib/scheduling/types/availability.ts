
export interface AvailabilitySlot {
  day: string;
  start: string;
  end: string;
}

export interface WeeklyAvailability {
  [key: string]: AvailabilitySlot[];
}
