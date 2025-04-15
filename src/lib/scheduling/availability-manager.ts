import { supabase } from "@/integrations/supabase/client";
import { BookedSession } from "./types/booking";
import { WeeklyAvailability } from "./types";
import { BookingSlot } from "./types/booking";
import { format, isAfter, isBefore, isSameDay, parse, parseISO } from "date-fns";
import { mapDateToDayOfWeek } from "./availability-utils";

export async function getTutorBookedSessions(
  tutorId: string,
  startDate: Date,
  endDate: Date
): Promise<BookedSession[]> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('start_time, end_time')
      .eq('tutor_id', tutorId)
      .gte('start_time', startDate.toISOString())
      .lte('end_time', endDate.toISOString())
      .in('status', ['pending', 'confirmed', 'in_progress']);
      
    if (error) throw error;
    
    return (data || []).map(session => ({
      start: new Date(session.start_time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      end: new Date(session.end_time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      date: new Date(session.start_time)
    }));
  } catch (error) {
    console.error("Error fetching booked sessions:", error);
    return [];
  }
}

export function generateAvailableSlots(
  availability: WeeklyAvailability,
  bookedSessions: BookedSession[],
  startDate: Date,
  daysToGenerate: number = 14
): BookingSlot[] {
  const slots: BookingSlot[] = [];
  
  // Generate slots for the specified number of days
  for (let i = 0; i < daysToGenerate; i++) {
    const currentDate = addDays(startDate, i);
    const dayOfWeek = mapDateToDayOfWeek(currentDate);
    const dayAvailability = availability[dayOfWeek] || [];
    
    // Skip days with no availability
    if (dayAvailability.length === 0) continue;
    
    // Find all booked sessions for this day
    const dayBookings = bookedSessions.filter(session => 
      isSameDay(session.date, currentDate)
    );
    
    // For each availability slot on this day
    dayAvailability.forEach(availSlot => {
      // Create time slots in 30-minute increments
      const startHour = parseInt(availSlot.start.split(':')[0]);
      const startMinute = parseInt(availSlot.start.split(':')[1] || '0');
      const endHour = parseInt(availSlot.end.split(':')[0]);
      const endMinute = parseInt(availSlot.end.split(':')[1] || '0');
      
      // Start time in minutes
      let slotStartMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      
      // Generate 30-minute slots
      while (slotStartMinutes < endMinutes) {
        const slotEndMinutes = Math.min(slotStartMinutes + 30, endMinutes);
        
        // Format as HH:MM
        const startTime = `${Math.floor(slotStartMinutes / 60).toString().padStart(2, '0')}:${(slotStartMinutes % 60).toString().padStart(2, '0')}`;
        const endTime = `${Math.floor(slotEndMinutes / 60).toString().padStart(2, '0')}:${(slotEndMinutes % 60).toString().padStart(2, '0')}`;
        
        // Check if this slot overlaps with any booking
        const isBooked = dayBookings.some(booking => {
          const bookingStartMinutes = parseInt(booking.start.split(':')[0]) * 60 + parseInt(booking.start.split(':')[1]);
          const bookingEndMinutes = parseInt(booking.end.split(':')[0]) * 60 + parseInt(booking.end.split(':')[1]);
          
          return (
            (slotStartMinutes >= bookingStartMinutes && slotStartMinutes < bookingEndMinutes) ||
            (slotEndMinutes > bookingStartMinutes && slotEndMinutes <= bookingEndMinutes) ||
            (slotStartMinutes <= bookingStartMinutes && slotEndMinutes >= bookingEndMinutes)
          );
        });
        
        if (!isBooked) {
          slots.push({
            tutorId: '', // Will be filled in by the calling code
            day: currentDate,
            start: startTime,
            end: endTime,
            available: true
          });
        }
        
        // Move to next slot
        slotStartMinutes += 30;
      }
    });
  }
  
  return slots;
}
