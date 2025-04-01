import React, { useState, useEffect, useCallback } from 'react';
import { addDays, format, startOfWeek, parse } from 'date-fns';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { WeeklyAvailability, AvailabilitySlot } from "@/lib/scheduling/types";

interface WeeklyAvailabilityCalendarProps {
  availability: WeeklyAvailability;
  onChange: (availability: WeeklyAvailability) => void;
  readOnly?: boolean;
}

export const WeeklyAvailabilityCalendar = ({
  availability,
  onChange,
  readOnly = false
}: WeeklyAvailabilityCalendarProps) => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'add' | 'remove'>('add');
  const [selectionStart, setSelectionStart] = useState<{day: string, hour: number} | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{day: string, hour: number} | null>(null);
  
  const hours = Array.from({ length: 14 }, (_, i) => i + 8);
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(currentWeekStart, i);
    return {
      date: day,
      name: format(day, 'EEE').toLowerCase(),
      fullName: format(day, 'EEEE').toLowerCase(),
      displayDate: format(day, 'MMM d')
    };
  });

  const handlePrevWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const isCellAvailable = (day: string, hour: number): boolean => {
    const hourStart = `${hour.toString().padStart(2, '0')}:00`;
    const hourEnd = `${(hour + 1).toString().padStart(2, '0')}:00`;
    
    return (availability[day] || []).some(slot => {
      const slotStart = slot.start;
      const slotEnd = slot.end;
      
      return slotStart < hourEnd && slotEnd > hourStart;
    });
  };

  const isInCurrentSelection = (day: string, hour: number): boolean => {
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
  };

  const handleCellMouseDown = (day: string, hour: number) => {
    if (readOnly) return;
    
    const isAvailable = isCellAvailable(day, hour);
    
    setSelectionMode(isAvailable ? 'remove' : 'add');
    setIsSelecting(true);
    setSelectionStart({ day, hour });
    setSelectionEnd({ day, hour });
  };

  const handleCellMouseEnter = (day: string, hour: number) => {
    if (!isSelecting || readOnly) return;
    setSelectionEnd({ day, hour });
  };

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

  useEffect(() => {
    if (isSelecting) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isSelecting, handleMouseUp]);

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <Button variant="outline" size="sm" onClick={handlePrevWeek}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <h3 className="text-lg font-medium">
            Week of {format(currentWeekStart, 'MMM d, yyyy')}
          </h3>
          
          <Button variant="outline" size="sm" onClick={handleNextWeek}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-[80px_repeat(7,1fr)]">
              <div className="h-16 border-b flex items-end justify-center pb-2 font-medium">
                Time
              </div>
              {weekDays.map((day, index) => (
                <div key={index} className="h-16 border-b flex flex-col items-center justify-center">
                  <div className="text-sm text-muted-foreground">{day.displayDate}</div>
                  <div className="font-medium capitalize">{day.name}</div>
                </div>
              ))}
            </div>
            
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)]">
                <div className="h-12 border-b flex items-center justify-center text-sm text-muted-foreground">
                  {format(new Date().setHours(hour, 0, 0, 0), 'h:mm a')}
                </div>
                
                {weekDays.map((day) => {
                  const isAvailable = isCellAvailable(day.fullName, hour);
                  const isSelected = isSelecting && isInCurrentSelection(day.fullName, hour);
                  const isAddingSelected = isSelected && selectionMode === 'add';
                  const isRemovingSelected = isSelected && selectionMode === 'remove';
                  
                  return (
                    <div
                      key={`${day.fullName}-${hour}`}
                      className={cn(
                        "h-12 border-b border-r cursor-pointer transition-colors",
                        isAvailable && !isSelected ? "bg-usc-cardinal hover:bg-usc-cardinal-dark" : "",
                        !isAvailable && !isSelected ? "bg-gray-100 hover:bg-gray-200" : "",
                        isAddingSelected ? "bg-usc-gold text-gray-900" : "",
                        isRemovingSelected ? "bg-gray-300" : "",
                        readOnly ? "cursor-default" : ""
                      )}
                      onMouseDown={!readOnly ? () => handleCellMouseDown(day.fullName, hour) : undefined}
                      onMouseEnter={!readOnly ? () => handleCellMouseEnter(day.fullName, hour) : undefined}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          {readOnly ? (
            <div>The colored cells indicate when the tutor is available.</div>
          ) : (
            <div>Click and drag to select or deselect time blocks for your availability.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
