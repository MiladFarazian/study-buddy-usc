
import { useState, useRef } from 'react';
import { BookingSlot } from "@/lib/scheduling";

export function useDragState() {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ hour: number, minute: number, day: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ hour: number, minute: number, day: number } | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

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
    setIsDragging,
    dragStart,
    setDragStart,
    dragEnd,
    setDragEnd,
    selectedSlot,
    setSelectedSlot,
    calendarRef,
    isInDragRange
  };
}
