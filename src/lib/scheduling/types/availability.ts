
// Represents a single availability time slot
export interface AvailabilitySlot {
  day: string;  // This was missing in one definition but required in another
  start: string;  // Format: "HH:MM" in 24-hour format
  end: string;    // Format: "HH:MM" in 24-hour format
}

// Weekly availability structure
export interface WeeklyAvailability {
  [key: string]: AvailabilitySlot[]; // Key is day of week (monday, tuesday, etc.)
  monday?: AvailabilitySlot[];
  tuesday?: AvailabilitySlot[];
  wednesday?: AvailabilitySlot[];
  thursday?: AvailabilitySlot[];
  friday?: AvailabilitySlot[];
  saturday?: AvailabilitySlot[];
  sunday?: AvailabilitySlot[];
}

// Type for database representation (for type safety)
export type WeeklyAvailabilityJson = Record<string, Array<{start: string; end: string; day: string}>>;
