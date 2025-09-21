import { WeeklyAvailability } from "./types/availability";
import { BookingSlot, BookedSession } from "./types/booking";
import { format, addDays, parse } from 'date-fns';

/**
 * Shared utility to check if a specific hour is available
 * This is the same logic used by the working calendar
 */
export function isCellAvailable(availability: WeeklyAvailability, day: string, hour: number): boolean {
  const hourStart = `${hour.toString().padStart(2, '0')}:00`;
  const hourEnd = `${(hour + 1).toString().padStart(2, '0')}:00`;
  
  return (availability[day] || []).some(slot => {
    const slotStart = slot.start;
    const slotEnd = slot.end;
    
    return slotStart < hourEnd && slotEnd > hourStart;
  });
}

/**
 * Smart slot generation - creates reasonable slots at hour boundaries
 * Instead of generating 30-minute slots everywhere, create hour-based slots
 */
export function generateSmartAvailableSlots(
  availability: WeeklyAvailability,
  bookedSessions: BookedSession[],
  startDate: Date,
  daysToGenerate: number,
  maxSlotsPerDay: number = 8
): BookingSlot[] {
  const availableSlots: BookingSlot[] = [];
  const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const now = new Date();
  const bufferTime = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3-hour buffer
  
  for (let i = 0; i < daysToGenerate; i++) {
    const currentDate = addDays(startDate, i);
    const dayOfWeek = weekDays[currentDate.getDay()];
    let slotsForDay = 0;
    
    // Generate slots at hour boundaries from 6 AM to 10 PM
    for (let hour = 6; hour <= 22 && slotsForDay < maxSlotsPerDay; hour++) {
      // Skip if hour is in the past
      const slotStartTime = parse(`${hour}:00`, 'HH:mm', currentDate);
      if (slotStartTime <= bufferTime) {
        continue;
      }
      
      // Check if this hour is available using the working calendar logic
      if (!isCellAvailable(availability, dayOfWeek, hour)) {
        continue;
      }
      
      const slotStart = `${hour.toString().padStart(2, '0')}:00`;
      const slotEnd = `${(hour + 1).toString().padStart(2, '0')}:00`;
      
      // Check for booked session conflicts
      const hasConflict = bookedSessions.some(session => {
        const sessionDate = new Date(session.date);
        if (sessionDate.toDateString() !== currentDate.toDateString()) {
          return false;
        }
        
        const sessionStartHour = parseInt(session.start.split(':')[0]);
        const sessionEndHour = Math.ceil(parseInt(session.end.split(':')[0]) + parseInt(session.end.split(':')[1]) / 60);
        
        return hour >= sessionStartHour && hour < sessionEndHour;
      });
      
      if (!hasConflict) {
        availableSlots.push({
          day: currentDate,
          start: slotStart,
          end: slotEnd,
          available: true,
          tutorId: '',
          durationMinutes: 60
        });
        slotsForDay++;
      }
    }
  }
  
  return availableSlots;
}

/**
 * Get available hours for a specific date using calendar logic
 */
export function getAvailableHours(availability: WeeklyAvailability, date: Date, bookedSessions: BookedSession[]): number[] {
  const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayOfWeek = weekDays[date.getDay()];
  const availableHours: number[] = [];
  const now = new Date();
  const bufferTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  
  for (let hour = 6; hour <= 22; hour++) {
    const slotStartTime = parse(`${hour}:00`, 'HH:mm', date);
    
    // Skip past hours
    if (slotStartTime <= bufferTime) {
      continue;
    }
    
    // Check availability using calendar logic
    if (!isCellAvailable(availability, dayOfWeek, hour)) {
      continue;
    }
    
    // Check for booking conflicts
    const hasConflict = bookedSessions.some(session => {
      const sessionDate = new Date(session.date);
      if (sessionDate.toDateString() !== date.toDateString()) {
        return false;
      }
      
      const sessionStartHour = parseInt(session.start.split(':')[0]);
      const sessionEndHour = Math.ceil(parseInt(session.end.split(':')[0]) + parseInt(session.end.split(':')[1]) / 60);
      
      return hour >= sessionStartHour && hour < sessionEndHour;
    });
    
    if (!hasConflict) {
      availableHours.push(hour);
    }
  }
  
  return availableHours;
}