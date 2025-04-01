import React, { useState, useEffect } from 'react';
import { addDays, format, startOfWeek, isWithinInterval } from 'date-fns';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { WeeklyAvailability } from "@/lib/scheduling/types";

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
  const [selectionStartCell, setSelectionStartCell] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  // Generate hours for the day
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM
  
  // Generate days of the week
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

  const isCellAvailable = (day: string, hour: number) => {
    if (!availability[day]) return false;
    
    const hourStr = hour.toString().padStart(2, '0');
    const nextHourStr = (hour + 1).toString().padStart(2, '0');
    
    return availability[day].some(slot => {
      const slotStart = slot.start.split(':')[0];
      const slotEnd = slot.end.split(':')[0];
      
      return parseInt(slotStart) <= hour && parseInt(slotEnd) > hour;
    });
  };

  const getCellKey = (day: string, hour: number) => `${day}-${hour}`;

  const isInSelection = (day: string, hour: number) => {
    if (!isSelecting || !selectionStartCell || !hoveredCell) return false;
    
    const [startDay, startHour] = selectionStartCell.split('-');
    const [endDay, endHour] = hoveredCell.split('-');
    
    const dayIndices = weekDays.map(d => d.fullName);
    const startDayIndex = dayIndices.indexOf(startDay);
    const endDayIndex = dayIndices.indexOf(endDay);
    const currentDayIndex = dayIndices.indexOf(day);
    
    const minDayIndex = Math.min(startDayIndex, endDayIndex);
    const maxDayIndex = Math.max(startDayIndex, endDayIndex);
    
    if (currentDayIndex < minDayIndex || currentDayIndex > maxDayIndex) return false;
    
    const startHourNum = parseInt(startHour);
    const endHourNum = parseInt(endHour);
    const minHour = Math.min(startHourNum, endHourNum);
    const maxHour = Math.max(startHourNum, endHourNum);
    
    return hour >= minHour && hour <= maxHour;
  };

  const handleMouseDown = (day: string, hour: number) => {
    if (readOnly) return;
    
    setIsSelecting(true);
    setSelectionStartCell(getCellKey(day, hour));
  };

  const handleMouseMove = (day: string, hour: number) => {
    if (readOnly) return;
    
    if (isSelecting) {
      setHoveredCell(getCellKey(day, hour));
    }
  };

  const handleMouseUp = () => {
    if (readOnly) return;
    
    if (isSelecting && selectionStartCell && hoveredCell) {
      const [startDay, startHour] = selectionStartCell.split('-');
      const [endDay, endHour] = hoveredCell.split('-');
      
      const dayIndices = weekDays.map(d => d.fullName);
      const startDayIndex = dayIndices.indexOf(startDay);
      const endDayIndex = dayIndices.indexOf(endDay);
      
      const minDayIndex = Math.min(startDayIndex, endDayIndex);
      const maxDayIndex = Math.max(startDayIndex, endDayIndex);
      
      const startHourNum = parseInt(startHour);
      const endHourNum = parseInt(endHour);
      const minHour = Math.min(startHourNum, endHourNum);
      const maxHour = Math.max(startHourNum, endHourNum);
      
      // Update availability
      const newAvailability = { ...availability };
      
      for (let dayIndex = minDayIndex; dayIndex <= maxDayIndex; dayIndex++) {
        const day = dayIndices[dayIndex];
        newAvailability[day] = newAvailability[day] || [];
        
        // Create new slot or update existing
        const startTime = `${minHour.toString().padStart(2, '0')}:00`;
        const endTime = `${(maxHour + 1).toString().padStart(2, '0')}:00`;
        
        // Check if we need to add or remove availability
        const isAddingAvailability = !isCellAvailable(day, minHour);
        
        if (isAddingAvailability) {
          // Check for overlapping slots and merge or add
          const overlappingSlots = newAvailability[day].filter(slot => {
            const slotStart = parseInt(slot.start.split(':')[0]);
            const slotEnd = parseInt(slot.end.split(':')[0]);
            return (slotStart <= maxHour + 1 && slotEnd >= minHour);
          });
          
          if (overlappingSlots.length > 0) {
            // Remove overlapping slots
            newAvailability[day] = newAvailability[day].filter(slot => {
              const slotStart = parseInt(slot.start.split(':')[0]);
              const slotEnd = parseInt(slot.end.split(':')[0]);
              return !(slotStart <= maxHour + 1 && slotEnd >= minHour);
            });
            
            // Get the min start and max end from all slots
            const allStarts = [minHour, ...overlappingSlots.map(s => parseInt(s.start.split(':')[0]))];
            const allEnds = [maxHour + 1, ...overlappingSlots.map(s => parseInt(s.end.split(':')[0]))];
            
            const newStart = Math.min(...allStarts).toString().padStart(2, '0') + ':00';
            const newEnd = Math.max(...allEnds).toString().padStart(2, '0') + ':00';
            
            // Add merged slot
            newAvailability[day].push({
              day,
              start: newStart,
              end: newEnd
            });
          } else {
            // Add new slot
            newAvailability[day].push({
              day,
              start: startTime,
              end: endTime
            });
          }
        } else {
          // Remove or update existing slots that overlap with selection
          newAvailability[day] = newAvailability[day].filter(slot => {
            const slotStart = parseInt(slot.start.split(':')[0]);
            const slotEnd = parseInt(slot.end.split(':')[0]);
            
            // Keep slots that don't overlap with our selection
            return !(slotStart < maxHour + 1 && slotEnd > minHour);
          });
        }
      }
      
      onChange(newAvailability);
    }
    
    setIsSelecting(false);
    setSelectionStartCell(null);
    setHoveredCell(null);
  };

  useEffect(() => {
    // Add global mouse up event listener to handle if mouse goes outside grid
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isSelecting, selectionStartCell, hoveredCell]);

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
            {/* Header Row with Days */}
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
            
            {/* Time Slots */}
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)]">
                <div className="h-12 border-b flex items-center justify-center text-sm text-muted-foreground">
                  {format(new Date().setHours(hour, 0, 0, 0), 'h:mm a')}
                </div>
                
                {weekDays.map((day, dayIndex) => {
                  const isAvailable = isCellAvailable(day.fullName, hour);
                  const inSelection = isInSelection(day.fullName, hour);
                  
                  return (
                    <div
                      key={`${day.name}-${hour}`}
                      className={cn(
                        "h-12 border-b border-r cursor-pointer transition-colors",
                        isAvailable && !inSelection ? "bg-usc-cardinal hover:bg-usc-cardinal-dark" : "",
                        !isAvailable && !inSelection ? "bg-gray-100 hover:bg-gray-200" : "",
                        inSelection ? "bg-usc-gold text-gray-900" : "",
                        readOnly && isAvailable ? "cursor-default bg-usc-cardinal" : "",
                        readOnly && !isAvailable ? "cursor-default bg-gray-100" : ""
                      )}
                      onMouseDown={!readOnly ? () => handleMouseDown(day.fullName, hour) : undefined}
                      onMouseMove={!readOnly ? () => handleMouseMove(day.fullName, hour) : undefined}
                      onMouseUp={!readOnly ? handleMouseUp : undefined}
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
