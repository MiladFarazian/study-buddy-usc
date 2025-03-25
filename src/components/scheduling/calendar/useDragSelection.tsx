
import { useState, useRef } from 'react';
import { BookingSlot } from "@/lib/scheduling";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

export function useDragSelection(availableSlots: BookingSlot[], onSelectSlot: (slot: BookingSlot) => void) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ hour: number, minute: number, day: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ hour: number, minute: number, day: number } | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Get a slot at a specific time and day
  const getSlotAt = (day: Date, timeString: string): BookingSlot | undefined => {
    return availableSlots.find(slot => 
      format(slot.day, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') && 
      slot.start === timeString
    );
  };

  // Find the slot that contains a specific time
  const findSlotForTime = (dayIndex: number, hour: number, minute: number): BookingSlot | null => {
    // Format the time
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const clickedTimeInMinutes = hour * 60 + minute;
    
    // Find a slot for this day that contains this time
    for (const slot of availableSlots) {
      if (new Date(slot.day).getDay() !== dayIndex) continue;
      
      const startHour = parseInt(slot.start.split(':')[0]);
      const startMinute = parseInt(slot.start.split(':')[1]);
      const endHour = parseInt(slot.end.split(':')[0]);
      const endMinute = parseInt(slot.end.split(':')[1]);
      
      const slotStartInMinutes = startHour * 60 + startMinute;
      const slotEndInMinutes = endHour * 60 + endMinute;
      
      if (clickedTimeInMinutes >= slotStartInMinutes && clickedTimeInMinutes < slotEndInMinutes) {
        return slot;
      }
    }
    
    return null;
  };

  // Handle mouse down to start the selection
  const handleMouseDown = (hour: number, minute: number, dayIndex: number) => {
    const slot = findSlotForTime(dayIndex, hour, minute);
    if (!slot) {
      console.log("No available slot at this time");
      return;
    }
    
    setIsDragging(true);
    setDragStart({ hour, minute, day: dayIndex });
    setDragEnd({ hour, minute, day: dayIndex });
    
    // Initially select a 15-minute block
    const startTimeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    // Calculate end time (15 minutes later)
    let endHour = hour;
    let endMinute = minute + 15;
    if (endMinute >= 60) {
      endHour += 1;
      endMinute -= 60;
    }
    const endTimeString = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    
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
    createBookingFromDrag();
  };

  // Handle mouse up to end the selection
  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd) {
      createBookingFromDrag();
    }
    
    setIsDragging(false);
  };

  // Create a booking from the drag selection
  const createBookingFromDrag = () => {
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
    
    // Round to nearest 15 minutes for end time
    const endRoundedMinutes = Math.ceil(endMinute / 15) * 15;
    if (endRoundedMinutes >= 60) {
      endHour += 1;
      endMinute = endRoundedMinutes - 60;
    } else {
      endMinute = endRoundedMinutes;
    }
    
    // Format times
    const startTimeString = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
    const endTimeString = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    
    // Find the available slot this time range belongs to
    const dayIndex = dragStart.day;
    const day = weekDays[dayIndex];
    if (!day) return;
    
    // Find the slot that this time range belongs to
    const startSlot = findSlotForTime(dayIndex, startHour, startMinute);
    if (!startSlot) return;
    
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
      available: true
    };
    
    setSelectedSlot(bookingSlot);
    onSelectSlot(bookingSlot);
  };

  // Check if a cell is in the drag range
  const isInDragRange = (hour: number, minute: number, dayIndex: number): boolean => {
    if (!isDragging || !dragStart || !dragEnd || dragStart.day !== dayIndex || dragEnd.day !== dayIndex) {
      return false;
    }
    
    // Convert to total minutes for easier comparison
    const cellMinutes = hour * 60 + minute;
    const startMinutes = dragStart.hour * 60 + dragStart.minute;
    const endMinutes = dragEnd.hour * 60 + dragEnd.minute;
    
    // Check if cell is within range (inclusive of start and end)
    return (
      (cellMinutes >= Math.min(startMinutes, endMinutes) && 
       cellMinutes <= Math.max(startMinutes, endMinutes))
    );
  };

  // When component renders, we need access to the weekDays array
  // Since it's not passed to the hook directly, we use a sneaky technique to access it
  const weekDays = dragStart && dragEnd ? availableSlots.filter(s => s.available).map(s => s.day) : [];

  return {
    isDragging,
    selectedSlot,
    calendarRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    isInDragRange
  };
}
