
import { useState, useRef, useCallback } from 'react';
import { BookingSlot } from '@/types/scheduling';

export const useDragSelection = (
  availableSlots: BookingSlot[],
  onSelectSlot: (slot: BookingSlot) => void
) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [dragRange, setDragRange] = useState<{ startDay: number; startHour: number; endDay: number; endHour: number } | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // Get slot at a specific day and hour position
  const getSlotAt = useCallback((dayIndex: number, hour: number): BookingSlot | null => {
    // Find slots for the specified day and hour
    const matchingSlots = availableSlots.filter(slot => {
      const slotDay = slot.day.getDay();
      const [slotHour] = slot.start.split(':').map(Number);
      
      return slotDay === dayIndex && slotHour === hour && slot.available;
    });
    
    return matchingSlots.length > 0 ? matchingSlots[0] : null;
  }, [availableSlots]);
  
  // Check if a cell is in the drag range
  const isInDragRange = useCallback((dayIndex: number, hour: number): boolean => {
    if (!isDragging || !dragRange) return false;
    
    const { startDay, startHour, endDay, endHour } = dragRange;
    
    // Ensure correct order of range
    const minDay = Math.min(startDay, endDay);
    const maxDay = Math.max(startDay, endDay);
    const minHour = Math.min(startHour, endHour);
    const maxHour = Math.max(startHour, endHour);
    
    return dayIndex >= minDay && dayIndex <= maxDay && hour >= minHour && hour <= maxHour;
  }, [isDragging, dragRange]);
  
  // Handle mouse down on a calendar cell
  const handleMouseDown = useCallback((dayIndex: number, hour: number) => {
    setIsDragging(true);
    
    // Find the slot at this position
    const slot = getSlotAt(dayIndex, hour);
    
    if (slot && slot.available) {
      setSelectedSlot(slot);
      onSelectSlot(slot);
      
      // Set initial drag range
      setDragRange({
        startDay: dayIndex,
        startHour: hour,
        endDay: dayIndex,
        endHour: hour
      });
    }
  }, [getSlotAt, onSelectSlot]);
  
  // Handle mouse move while dragging
  const handleMouseMove = useCallback((dayIndex: number, hour: number) => {
    if (!isDragging || !dragRange) return;
    
    // Update the drag range
    setDragRange(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        endDay: dayIndex,
        endHour: hour
      };
    });
    
    // Find the slot at this position
    const slot = getSlotAt(dayIndex, hour);
    
    if (slot && slot.available) {
      setSelectedSlot(slot);
      onSelectSlot(slot);
    }
  }, [isDragging, dragRange, getSlotAt, onSelectSlot]);
  
  // Handle mouse up to end dragging
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragRange(null);
  }, []);
  
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
};
