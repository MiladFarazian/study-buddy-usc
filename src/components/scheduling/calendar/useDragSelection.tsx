
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

  const handleMouseDown = (hour: number, minute: number, dayIndex: number) => {
    const slot = getSlotAt(dayIndex, `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    if (!slot || !slot.available) return;
    
    setIsDragging(true);
    setDragStart({ hour, minute, day: dayIndex });
    setDragEnd({ hour, minute, day: dayIndex });
  };

  const handleMouseMove = (hour: number, minute: number, dayIndex: number) => {
    if (!isDragging || !dragStart) return;
    
    // Only allow dragging within the same day
    if (dragStart.day !== dayIndex) return;
    
    // Ensure the time is available
    const slot = getSlotAt(dayIndex, `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    if (!slot || !slot.available) return;
    
    setDragEnd({ hour, minute, day: dayIndex });
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd) {
      // Create a booking slot from the dragged selection
      createBookingFromDrag();
    }
    
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
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
    const slots = availableSlots.filter(slot => 
      dayIndex === new Date(slot.day).getDay()
    );
    
    if (slots.length === 0) {
      console.error("No available slots for selected day");
      return;
    }
    
    const day = slots[0].day;
    const startTime = `${startCoord.hour.toString().padStart(2, '0')}:${startCoord.minute.toString().padStart(2, '0')}`;
    
    // End time is 15 minutes after the selected end cell
    let endHour = endCoord.hour;
    let endMinute = endCoord.minute + 15;
    
    if (endMinute >= 60) {
      endHour += 1;
      endMinute -= 60;
    }
    
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    
    // Verify that the entire time range is available
    const allSlotsAvailable = verifyRangeAvailability(dayIndex, startTime, endTime);
    
    if (!allSlotsAvailable) {
      toast({
        title: "Invalid Selection",
        description: "The entire time range must be available for booking.",
        variant: "destructive",
      });
      return;
    }
    
    // Create a booking slot
    const bookingSlot: BookingSlot = {
      tutorId: availableSlots[0]?.tutorId || '',
      day: day,
      start: startTime,
      end: endTime,
      available: true
    };
    
    setSelectedSlot(bookingSlot);
    onSelectSlot(bookingSlot);
  };

  const getSlotAt = (dayIndex: number, timeString: string): BookingSlot | undefined => {
    return availableSlots.find(slot => 
      new Date(slot.day).getDay() === dayIndex && 
      slot.start === timeString
    );
  };

  const verifyRangeAvailability = (dayIndex: number, startTime: string, endTime: string): boolean => {
    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    
    // Check every 15-minute slot in the range
    for (let currentMinutes = startMinutes; currentMinutes < endMinutes; currentMinutes += 15) {
      const timeString = formatTimeFromMinutes(currentMinutes);
      const slot = getSlotAt(dayIndex, timeString);
      
      if (!slot || !slot.available) {
        return false;
      }
    }
    
    return true;
  };

  const parseTimeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatTimeFromMinutes = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
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
