
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

  // Helper function to get a slot at a specific time and day
  const getSlotAt = (dayIndex: number, timeString: string): BookingSlot | undefined => {
    return availableSlots.find(slot => 
      new Date(slot.day).getDay() === dayIndex && 
      slot.start === timeString
    );
  };

  // Find the full availability block a time belongs to
  const findAvailabilityBlock = (dayIndex: number, hour: number, minute: number) => {
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    // Get all slots for this day
    const daySlotsMap = new Map();
    availableSlots
      .filter(slot => new Date(slot.day).getDay() === dayIndex)
      .forEach(slot => {
        daySlotsMap.set(slot.start, slot);
      });
    
    // Look for slots that contain this time
    for (const [startTime, slot] of daySlotsMap.entries()) {
      const startHour = parseInt(startTime.split(':')[0]);
      const startMinute = parseInt(startTime.split(':')[1]);
      const endHour = parseInt(slot.end.split(':')[0]);
      const endMinute = parseInt(slot.end.split(':')[1]);
      
      const clickedTimeInMinutes = hour * 60 + minute;
      const slotStartInMinutes = startHour * 60 + startMinute;
      const slotEndInMinutes = endHour * 60 + endMinute;
      
      if (clickedTimeInMinutes >= slotStartInMinutes && clickedTimeInMinutes < slotEndInMinutes) {
        return slot;
      }
    }
    
    return null;
  };

  const handleMouseDown = (hour: number, minute: number, dayIndex: number) => {
    // Find the availability block this time belongs to
    const availabilityBlock = findAvailabilityBlock(dayIndex, hour, minute);
    if (!availabilityBlock) return;
    
    setIsDragging(true);
    setDragStart({ hour, minute, day: dayIndex });
    setDragEnd({ hour, minute, day: dayIndex });
    
    // If clicking on an availability block, select it immediately
    const day = availabilityBlock.day;
    const bookingSlot: BookingSlot = {
      tutorId: availabilityBlock.tutorId,
      day: day,
      start: availabilityBlock.start,
      end: availabilityBlock.end,
      available: true
    };
    
    setSelectedSlot(bookingSlot);
    onSelectSlot(bookingSlot);
  };

  const handleMouseMove = (hour: number, minute: number, dayIndex: number) => {
    if (!isDragging || !dragStart) return;
    
    // Only allow dragging within the same day
    if (dragStart.day !== dayIndex) return;
    
    // Ensure the time is within an available block
    const availabilityBlock = findAvailabilityBlock(dayIndex, hour, minute);
    if (!availabilityBlock) return;
    
    setDragEnd({ hour, minute, day: dayIndex });
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd) {
      // Create a booking slot from the dragged selection
      createBookingFromDrag();
    }
    
    setIsDragging(false);
  };

  const createBookingFromDrag = () => {
    if (!dragStart || !dragEnd) return;
    
    // Ensure start is before end
    let startCoord = dragStart;
    let endCoord = dragEnd;
    
    if (
      (startCoord.hour > endCoord.hour) || 
      (startCoord.hour === endCoord.hour && startCoord.minute > endCoord.minute)
    ) {
      // Swap if start is after end
      [startCoord, endCoord] = [endCoord, startCoord];
    }
    
    const dayIndex = startCoord.day;
    
    // Get start block
    const startBlock = findAvailabilityBlock(dayIndex, startCoord.hour, startCoord.minute);
    if (!startBlock) return;
    
    // Get end block
    const endBlock = findAvailabilityBlock(dayIndex, endCoord.hour, endCoord.minute);
    if (!endBlock) return;
    
    // If blocks are different, check if they're contiguous
    if (startBlock !== endBlock) {
      // For simplicity, let's use the last block's end time
      // A more sophisticated implementation would check for contiguity
      const day = startBlock.day;
      const bookingSlot: BookingSlot = {
        tutorId: startBlock.tutorId,
        day: day,
        start: startBlock.start,
        end: endBlock.end,
        available: true
      };
      
      setSelectedSlot(bookingSlot);
      onSelectSlot(bookingSlot);
      return;
    }
    
    // If same block, use that block
    const day = startBlock.day;
    const bookingSlot: BookingSlot = {
      tutorId: startBlock.tutorId,
      day: day,
      start: startBlock.start,
      end: startBlock.end,
      available: true
    };
    
    setSelectedSlot(bookingSlot);
    onSelectSlot(bookingSlot);
  };

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
