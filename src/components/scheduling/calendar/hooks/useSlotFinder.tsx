
import { useState } from 'react';
import { BookingSlot } from "@/lib/scheduling";
import { format } from 'date-fns';
import { convertTimeToMinutes, formatTimeString } from './useTimeFormatting';

export function useSlotFinder(availableSlots: BookingSlot[]) {
  // Find the slot that contains a specific time
  const findSlotForTime = (dayIndex: number, hour: number, minute: number): BookingSlot | null => {
    // Make sure availableSlots exists before using it
    if (!availableSlots.length) return null;
    
    // Get all unique dates from available slots
    const uniqueDates = Array.from(new Set(availableSlots.map(slot => format(slot.day, 'yyyy-MM-dd'))));
    
    // Map these to days of week to find the right date for this dayIndex
    const weekDays = uniqueDates.map(dateStr => new Date(dateStr));
    
    if (dayIndex < 0 || dayIndex >= weekDays.length) {
      console.log(`Invalid day index: ${dayIndex}, weekDays length: ${weekDays.length}`);
      return null;
    }
    
    const day = weekDays[dayIndex];
    if (!day) {
      console.log(`No day found for index ${dayIndex}`);
      return null;
    }
    
    // Format the time
    const timeString = formatTimeString(hour, minute);
    const clickedTimeInMinutes = hour * 60 + minute;
    const formattedDay = format(day, 'yyyy-MM-dd');
    
    // Find a slot for this day that contains this time
    for (const slot of availableSlots) {
      // Check if this slot is for the same day
      if (format(slot.day, 'yyyy-MM-dd') !== formattedDay) continue;
      
      // Convert slot times to minutes
      const startTimeInMinutes = convertTimeToMinutes(slot.start);
      const endTimeInMinutes = convertTimeToMinutes(slot.end);
      
      // Check if clicked time is within slot
      if (clickedTimeInMinutes >= startTimeInMinutes && clickedTimeInMinutes < endTimeInMinutes) {
        return slot;
      }
    }
    
    return null;
  };

  // Get a slot at a specific time and day
  const getSlotAt = (day: Date, timeString: string): BookingSlot | undefined => {
    const formattedDay = format(day, 'yyyy-MM-dd');
    // Check for an exact match first
    const exactMatch = availableSlots.find(slot => 
      format(slot.day, 'yyyy-MM-dd') === formattedDay && 
      slot.start === timeString
    );
    
    if (exactMatch) return exactMatch;
    
    // If no exact match, check if this time is within any available slot
    const timeInMinutes = convertTimeToMinutes(timeString);
    
    return availableSlots.find(slot => {
      if (format(slot.day, 'yyyy-MM-dd') !== formattedDay) return false;
      
      const slotStartMinutes = convertTimeToMinutes(slot.start);
      const slotEndMinutes = convertTimeToMinutes(slot.end);
      
      return timeInMinutes >= slotStartMinutes && timeInMinutes < slotEndMinutes;
    });
  };

  return { findSlotForTime, getSlotAt };
}
