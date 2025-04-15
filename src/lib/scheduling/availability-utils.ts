
import { WeeklyAvailability } from "./types/availability";

// Map a date to the day of the week
export function mapDateToDayOfWeek(date: Date): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

// Check if a date has availability based on the day of the week
export function hasAvailabilityForDate(date: Date, availability: WeeklyAvailability): boolean {
  const dayOfWeek = mapDateToDayOfWeek(date);
  return availability[dayOfWeek]?.length > 0;
}

// Get available time slots for a specific day
export function getAvailableTimeSlotsForDay(
  date: Date, 
  availability: WeeklyAvailability,
  bookedSlots: { start: string; end: string }[] = []
): { start: string; end: string }[] {
  const dayOfWeek = mapDateToDayOfWeek(date);
  const dayAvailability = availability[dayOfWeek] || [];
  
  // Filter out time slots that overlap with booked sessions
  return dayAvailability.filter(slot => {
    // Check if this available slot conflicts with any booked slot
    return !bookedSlots.some(booked => {
      const availStart = slot.start;
      const availEnd = slot.end;
      const bookedStart = booked.start;
      const bookedEnd = booked.end;
      
      // Check if there's any overlap
      return (
        (availStart < bookedEnd && availEnd > bookedStart)
      );
    });
  });
}
