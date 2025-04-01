import { useState, useCallback } from 'react';
import { WeeklyAvailability, AvailabilitySlot } from "@/lib/scheduling/types";

interface WeekDay {
  fullName: string;
  // other properties not used in this hook
}

export function useSelectionState(
  availability: WeeklyAvailability, 
  onChange: (availability: WeeklyAvailability) => void,
  weekDays: { fullName: string }[],
  readOnly: boolean
) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'add' | 'remove'>('add');
  const [selectionStart, setSelectionStart] = useState<{day: string, hour: number} | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{day: string, hour: number} | null>(null);
  
  const isCellAvailable = useCallback((day: string, hour: number): boolean => {
    const hourStart = `${hour.toString().padStart(2, '0')}:00`;
    const hourEnd = `${(hour + 1).toString().padStart(2, '0')}:00`;
    
    return (availability[day] || []).some(slot => {
      const slotStart = slot.start;
      const slotEnd = slot.end;
      
      return slotStart < hourEnd && slotEnd > hourStart;
    });
  }, [availability]);

  const isInCurrentSelection = useCallback((day: string, hour: number): boolean => {
    if (!selectionStart || !selectionEnd) return false;
    
    const dayIndices = weekDays.map(d => d.fullName);
    const startDayIndex = dayIndices.indexOf(selectionStart.day);
    const endDayIndex = dayIndices.indexOf(selectionEnd.day);
    const currentDayIndex = dayIndices.indexOf(day);
    
    const minDayIndex = Math.min(startDayIndex, endDayIndex);
    const maxDayIndex = Math.max(startDayIndex, endDayIndex);
    
    if (currentDayIndex < minDayIndex || currentDayIndex > maxDayIndex) return false;
    
    const minHour = Math.min(selectionStart.hour, selectionEnd.hour);
    const maxHour = Math.max(selectionStart.hour, selectionEnd.hour);
    
    return hour >= minHour && hour <= maxHour;
  }, [selectionStart, selectionEnd, weekDays]);

  const handleCellMouseDown = useCallback((day: string, hour: number) => {
    if (readOnly) return;
    
    const isAvailable = isCellAvailable(day, hour);
    
    setSelectionMode(isAvailable ? 'remove' : 'add');
    setIsSelecting(true);
    setSelectionStart({ day, hour });
    setSelectionEnd({ day, hour });
  }, [readOnly, isCellAvailable]);

  const handleCellMouseEnter = useCallback((day: string, hour: number) => {
    if (!isSelecting || readOnly) return;
    setSelectionEnd({ day, hour });
  }, [isSelecting, readOnly]);

  const updateAvailabilityFromSelection = useCallback(() => {
    if (!selectionStart || !selectionEnd) return;
    
    const newAvailability = { ...availability };
    const dayIndices = weekDays.map(d => d.fullName);
    const startDayIndex = dayIndices.indexOf(selectionStart.day);
    const endDayIndex = dayIndices.indexOf(selectionEnd.day);
    
    const minDayIndex = Math.min(startDayIndex, endDayIndex);
    const maxDayIndex = Math.max(startDayIndex, endDayIndex);
    
    const minHour = Math.min(selectionStart.hour, selectionEnd.hour);
    const maxHour = Math.max(selectionStart.hour, selectionEnd.hour);
    
    for (let dayIndex = minDayIndex; dayIndex <= maxDayIndex; dayIndex++) {
      const currentDay = dayIndices[dayIndex];
      
      if (selectionMode === 'add') {
        const newSlot: AvailabilitySlot = {
          day: currentDay,
          start: `${minHour.toString().padStart(2, '0')}:00`,
          end: `${(maxHour + 1).toString().padStart(2, '0')}:00`
        };
        
        const existingSlots = newAvailability[currentDay] || [];
        
        const nonOverlappingSlots = existingSlots.filter(slot => {
          const slotStart = parseInt(slot.start.split(':')[0]);
          const slotEnd = parseInt(slot.end.split(':')[0]);
          
          return slotEnd <= minHour || slotStart >= maxHour + 1;
        });
        
        const allSlots = [...nonOverlappingSlots, newSlot];
        const sortedSlots = allSlots.sort((a, b) => {
          return parseInt(a.start) - parseInt(b.start);
        });
        
        const mergedSlots: AvailabilitySlot[] = [];
        let currentSlot = sortedSlots[0];
        
        for (let i = 1; i < sortedSlots.length; i++) {
          const nextSlot = sortedSlots[i];
          const currentEnd = parseInt(currentSlot.end.split(':')[0]);
          const nextStart = parseInt(nextSlot.start.split(':')[0]);
          
          if (currentEnd >= nextStart) {
            currentSlot.end = nextSlot.end > currentSlot.end ? nextSlot.end : currentSlot.end;
          } else {
            mergedSlots.push(currentSlot);
            currentSlot = nextSlot;
          }
        }
        
        mergedSlots.push(currentSlot);
        
        newAvailability[currentDay] = mergedSlots;
      } else {
        const existingSlots = newAvailability[currentDay] || [];
        
        const resultSlots: AvailabilitySlot[] = [];
        
        existingSlots.forEach(slot => {
          const slotStart = parseInt(slot.start.split(':')[0]);
          const slotEnd = parseInt(slot.end.split(':')[0]);
          
          if (slotEnd <= minHour || slotStart >= maxHour + 1) {
            resultSlots.push(slot);
          } else {
            if (slotStart < minHour) {
              resultSlots.push({
                day: currentDay,
                start: slot.start,
                end: `${minHour.toString().padStart(2, '0')}:00`
              });
            }
            
            if (slotEnd > maxHour + 1) {
              resultSlots.push({
                day: currentDay,
                start: `${(maxHour + 1).toString().padStart(2, '0')}:00`,
                end: slot.end
              });
            }
          }
        });
        
        newAvailability[currentDay] = resultSlots;
      }
    }
    
    onChange(newAvailability);
  }, [availability, onChange, selectionStart, selectionEnd, weekDays, selectionMode]);

  const handleMouseUp = useCallback(() => {
    if (isSelecting) {
      updateAvailabilityFromSelection();
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  }, [isSelecting, updateAvailabilityFromSelection]);

  return {
    isSelecting,
    selectionMode,
    selectionStart,
    selectionEnd,
    handleCellMouseDown,
    handleCellMouseEnter,
    handleMouseUp,
    isInCurrentSelection,
    isCellAvailable,
    updateAvailabilityFromSelection
  };
}
