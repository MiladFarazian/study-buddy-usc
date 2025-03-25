
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
  
  // Helper function to convert HH:MM to minutes
  const convertTimeToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Find the slot that contains a specific time
  const findSlotForTime = (dayIndex: number, hour: number, minute: number): BookingSlot | null => {
    // Make sure weekDays exists before using it
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
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const clickedTimeInMinutes = hour * 60 + minute;
    const formattedDay = format(day, 'yyyy-MM-dd');
    
    // Find a slot for this day that contains this time
    for (const slot of availableSlots) {
      // Check if this slot is for the same day
      if (format(slot.day, 'yyyy-MM-dd') !== formattedDay) continue;
      
      // Convert slot times to minutes
      const startHour = parseInt(slot.start.split(':')[0]);
      const startMinute = parseInt(slot.start.split(':')[1]);
      const endHour = parseInt(slot.end.split(':')[0]);
      const endMinute = parseInt(slot.end.split(':')[1]);
      
      const slotStartInMinutes = startHour * 60 + startMinute;
      const slotEndInMinutes = endHour * 60 + endMinute;
      
      // Check if clicked time is within slot
      if (clickedTimeInMinutes >= slotStartInMinutes && clickedTimeInMinutes < slotEndInMinutes) {
        return slot;
      }
    }
    
    return null;
  };

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
      console.log("Ending drag selection");
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
      available: true
    };
    
    console.log("Final booking slot:", bookingSlot);
    
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
