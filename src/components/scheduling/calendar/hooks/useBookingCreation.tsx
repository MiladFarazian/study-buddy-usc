
import { useState } from 'react';
import { format } from 'date-fns';
import { BookingSlot } from "@/lib/scheduling";
import { useToast } from "@/hooks/use-toast";
import { convertTimeToMinutes, formatTimeString } from './useTimeFormatting';

export function useBookingCreation(
  availableSlots: BookingSlot[], 
  onSelectSlot: (slot: BookingSlot) => void,
  findSlotForTime: (dayIndex: number, hour: number, minute: number) => BookingSlot | null
) {
  const { toast } = useToast();

  // Create a booking from the drag selection
  const createBookingFromDrag = (
    dragStart: { hour: number, minute: number, day: number } | null,
    dragEnd: { hour: number, minute: number, day: number } | null,
    setSelectedSlot: (slot: BookingSlot | null) => void
  ) => {
    if (!dragStart || !dragEnd) return;
    
    // Get times in minutes for easier comparison
    let startHour = dragStart.hour;
    let startMinute = dragStart.minute;
    let endHour = dragEnd.hour;
    let endMinute = dragEnd.minute;
    
    // Ensure start time is before end time
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    
    if (startTotalMinutes > endTotalMinutes) {
      // Swap if start is after end
      [startHour, endHour] = [endHour, startHour];
      [startMinute, endMinute] = [endMinute, startMinute];
    }
    
    // Round to nearest 30 minutes for end time
    const endRoundedMinutes = Math.ceil(endMinute / 30) * 30;
    if (endRoundedMinutes >= 60) {
      endHour += 1;
      endMinute = endRoundedMinutes - 60;
    } else {
      endMinute = endRoundedMinutes;
    }
    
    // Format times
    const startTimeString = formatTimeString(startHour, startMinute);
    const endTimeString = formatTimeString(endHour, endMinute);
    
    // Get all unique dates from available slots
    const uniqueDates = Array.from(new Set(availableSlots.map(slot => format(slot.day, 'yyyy-MM-dd'))));
    const weekDays = uniqueDates.map(dateStr => new Date(dateStr));
    
    // Find the day for this selection
    const dayIndex = dragStart.day;
    if (dayIndex < 0 || dayIndex >= weekDays.length) {
      console.log(`Invalid day index: ${dayIndex}, weekDays length: ${weekDays.length}`);
      return;
    }
    
    const day = weekDays[dayIndex];
    if (!day) {
      console.log(`No day found for index ${dayIndex}`);
      return;
    }
    
    // Find the slot that this time range belongs to
    const startSlot = findSlotForTime(dayIndex, startHour, startMinute);
    if (!startSlot) {
      console.log("No slot found for start time");
      return;
    }
    
    console.log("Creating booking from drag:", {
      startTime: startTimeString,
      endTime: endTimeString,
      day: format(day, 'yyyy-MM-dd')
    });
    
    // Check that the selection doesn't go beyond the available slot
    const slotEndHour = parseInt(startSlot.end.split(':')[0]);
    const slotEndMinute = parseInt(startSlot.end.split(':')[1]);
    const slotEndInMinutes = slotEndHour * 60 + slotEndMinute;
    const selectedEndInMinutes = endHour * 60 + endMinute;
    
    // If our selection would go beyond the slot's end, use the slot's end instead
    let finalEndTimeString = endTimeString;
    if (selectedEndInMinutes > slotEndInMinutes) {
      finalEndTimeString = startSlot.end;
    }
    
    // Create the booking slot
    const bookingSlot: BookingSlot = {
      tutorId: startSlot.tutorId,
      day: startSlot.day,
      start: startTimeString,
      end: finalEndTimeString,
      available: true,
      availabilityEnd: startSlot.availabilityEnd || startSlot.end
    };
    
    console.log("Final booking slot:", bookingSlot);
    
    setSelectedSlot(bookingSlot);
    onSelectSlot(bookingSlot);
  };

  return { createBookingFromDrag };
}
