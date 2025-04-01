
import { useState, useEffect } from 'react';
import { BookingSlot } from "@/lib/scheduling";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { useDragState } from './hooks/useDragState';
import { useSlotFinder } from './hooks/useSlotFinder';
import { useBookingCreation } from './hooks/useBookingCreation';
import { formatTimeString } from './hooks/useTimeFormatting';

export function useDragSelection(availableSlots: BookingSlot[], onSelectSlot: (slot: BookingSlot) => void) {
  const { toast } = useToast();
  
  // Custom hooks
  const {
    isDragging, 
    setIsDragging,
    dragStart, 
    setDragStart,
    dragEnd, 
    setDragEnd,
    selectedSlot, 
    setSelectedSlot,
    calendarRef,
    isInDragRange
  } = useDragState();
  
  const { findSlotForTime, getSlotAt } = useSlotFinder(availableSlots);
  
  const { createBookingFromDrag } = useBookingCreation(
    availableSlots, 
    onSelectSlot,
    findSlotForTime
  );

  // Handle mouse down to start the selection
  const handleMouseDown = (hour: number, minute: number, dayIndex: number) => {
    // Get the available slot at this time if any
    const slot = findSlotForTime(dayIndex, hour, minute);
    
    if (!slot) {
      console.log("No available slot at this time");
      return;
    }
    
    console.log("Starting drag at", hour, minute, "on day", dayIndex);
    console.log("Found slot:", slot);
    
    setIsDragging(true);
    setDragStart({ hour, minute, day: dayIndex });
    setDragEnd({ hour, minute, day: dayIndex });
    
    // Initially select a 30-minute block
    const startTimeString = formatTimeString(hour, minute);
    
    // Calculate end time (30 minutes later)
    let endHour = hour;
    let endMinute = minute + 30;
    if (endMinute >= 60) {
      endHour += 1;
      endMinute -= 60;
    }
    const endTimeString = formatTimeString(endHour, endMinute);
    
    // Make sure we don't go beyond the available slot's end time
    const slotEndHour = parseInt(slot.end.split(':')[0]);
    const slotEndMinute = parseInt(slot.end.split(':')[1]);
    const slotEndInMinutes = slotEndHour * 60 + slotEndMinute;
    const selectedEndInMinutes = endHour * 60 + endMinute;
    
    // If our selection would go beyond the slot's end, use the slot's end instead
    let finalEndTimeString = endTimeString;
    if (selectedEndInMinutes > slotEndInMinutes) {
      finalEndTimeString = slot.end;
    }
    
    const bookingSlot: BookingSlot = {
      tutorId: slot.tutorId,
      day: slot.day,
      start: startTimeString,
      end: finalEndTimeString,
      available: true
    };
    
    setSelectedSlot(bookingSlot);
    onSelectSlot(bookingSlot);
  };

  // Handle mouse move to update the selection
  const handleMouseMove = (hour: number, minute: number, dayIndex: number) => {
    if (!isDragging || !dragStart) return;
    
    // Only allow dragging within the same day
    if (dragStart.day !== dayIndex) return;
    
    // Find the slot this time belongs to
    const slot = findSlotForTime(dayIndex, hour, minute);
    if (!slot) return;
    
    setDragEnd({ hour, minute, day: dayIndex });
    
    // Create the booking from drag selection
    createBookingFromDrag(dragStart, dragEnd, setSelectedSlot);
  };

  // Handle mouse up to end the selection
  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd) {
      console.log("Ending drag selection");
      createBookingFromDrag(dragStart, dragEnd, setSelectedSlot);
    }
    
    setIsDragging(false);
  };

  return {
    isDragging,
    selectedSlot,
    calendarRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    isInDragRange,
    getSlotAt
  };
}
