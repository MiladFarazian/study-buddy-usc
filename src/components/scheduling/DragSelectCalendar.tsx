import React, { useState, useRef, useEffect } from 'react';
import { format, parseISO, addDays, startOfWeek, eachDayOfInterval } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { WeeklyAvailability, AvailabilitySlot } from '@/lib/scheduling-utils';

interface TimeSlot {
  time: string;
  dayOfWeek: string;
  selected: boolean;
}

interface DragSelectCalendarProps {
  availability: WeeklyAvailability;
  onChange: (newAvailability: WeeklyAvailability) => void;
  className?: string;
}

export const DragSelectCalendar = ({ availability, onChange, className }: DragSelectCalendarProps) => {
  const [startDate, setStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[][]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragState, setDragState] = useState<boolean | null>(null);
  const [dragStartCoord, setDragStartCoord] = useState<{ row: number; col: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  
  // Hours to display in the calendar (24-hour format)
  const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM
  
  // Days of the week
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  useEffect(() => {
    // Generate array of dates for the week
    const days = eachDayOfInterval({
      start: startDate,
      end: addDays(startDate, 6)
    });
    setWeekDays(days);
    
    // Initialize time slots grid
    initializeTimeSlots();
  }, [startDate, availability]);
  
  const initializeTimeSlots = () => {
    const slots: TimeSlot[][] = [];
    
    // Create a slot for each 15-minute interval
    hours.forEach(hour => {
      [0, 15, 30, 45].forEach(minute => {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const rowSlots: TimeSlot[] = [];
        
        daysOfWeek.forEach(day => {
          // Check if this time slot is in the availability
          const isSelected = isTimeSlotSelected(day, timeString);
          rowSlots.push({
            time: timeString,
            dayOfWeek: day,
            selected: isSelected
          });
        });
        
        slots.push(rowSlots);
      });
    });
    
    setTimeSlots(slots);
  };
  
  const isTimeSlotSelected = (day: string, time: string): boolean => {
    if (!availability[day]) return false;
    
    return availability[day].some(slot => {
      // Check if the time is within any slot's range
      const slotStart = parseTimeToMinutes(slot.start);
      const slotEnd = parseTimeToMinutes(slot.end);
      const currentTime = parseTimeToMinutes(time);
      
      return currentTime >= slotStart && currentTime < slotEnd;
    });
  };
  
  const parseTimeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const formatTimeToString = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };
  
  const handleMouseDown = (row: number, col: number) => {
    if (!gridRef.current) return;
    
    setIsDragging(true);
    setDragStartCoord({ row, col });
    
    // Toggle the selection state based on the current state of the first cell
    const newDragState = !timeSlots[row][col].selected;
    setDragState(newDragState);
    
    // Update the selection for this cell
    updateSelection(row, col, newDragState);
  };
  
  const handleMouseMove = (row: number, col: number) => {
    if (!isDragging || dragState === null || !dragStartCoord) return;
    
    updateSelection(row, col, dragState);
  };
  
  const handleMouseUp = () => {
    if (isDragging) {
      // Convert timeSlots to availability format and trigger onChange
      const newAvailability = convertToAvailabilityFormat();
      onChange(newAvailability);
      
      // Reset drag state
      setIsDragging(false);
      setDragState(null);
      setDragStartCoord(null);
    }
  };
  
  const updateSelection = (row: number, col: number, selected: boolean) => {
    // Update the timeSlots state with the new selection
    setTimeSlots(prev => {
      const newTimeSlots = [...prev];
      
      // Handle drag selection by selecting all cells between start and current
      if (dragStartCoord) {
        const startRow = Math.min(dragStartCoord.row, row);
        const endRow = Math.max(dragStartCoord.row, row);
        const startCol = Math.min(dragStartCoord.col, col);
        const endCol = Math.max(dragStartCoord.col, col);
        
        // If dragging within the same column, update all cells in that column
        if (dragStartCoord.col === col) {
          for (let r = startRow; r <= endRow; r++) {
            newTimeSlots[r][col].selected = selected;
          }
        } 
        // Otherwise update the rectangular selection
        else {
          for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
              newTimeSlots[r][c].selected = selected;
            }
          }
        }
      } else {
        // Just update the single cell
        newTimeSlots[row][col].selected = selected;
      }
      
      return newTimeSlots;
    });
  };
  
  const convertToAvailabilityFormat = (): WeeklyAvailability => {
    const result: WeeklyAvailability = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    };
    
    // For each day of the week, find continuous blocks of selected cells
    daysOfWeek.forEach((day, dayIndex) => {
      let currentSlot: { start: string; end: string } | null = null;
      
      // Loop through all time slots for this day
      for (let rowIndex = 0; rowIndex < timeSlots.length; rowIndex++) {
        const isSelected = timeSlots[rowIndex][dayIndex].selected;
        const time = timeSlots[rowIndex][dayIndex].time;
        
        if (isSelected) {
          // If starting a new slot
          if (!currentSlot) {
            currentSlot = {
              start: time,
              end: ''
            };
          }
          
          // If this is the last row or the next row is not selected,
          // complete this slot with the end time (15 minutes after current time)
          if (rowIndex === timeSlots.length - 1 || !timeSlots[rowIndex + 1][dayIndex].selected) {
            // Calculate the end time (15 minutes after the current time)
            const [hours, minutes] = time.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes + 15;
            const endTime = formatTimeToString(totalMinutes);
            
            currentSlot.end = endTime;
            result[day].push({ ...currentSlot, day });
            currentSlot = null;
          }
        }
      }
    });
    
    return result;
  };
  
  const handlePrevWeek = () => {
    setStartDate(prev => addDays(prev, -7));
  };
  
  const handleNextWeek = () => {
    setStartDate(prev => addDays(prev, 7));
  };
  
  return (
    <div className={cn("w-full", className)} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" size="sm" onClick={handlePrevWeek}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        <h3 className="text-lg font-medium">
          Week of {format(startDate, 'MMM d, yyyy')}
        </h3>
        <Button variant="outline" size="sm" onClick={handleNextWeek}>
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      <div className="border rounded-md overflow-hidden">
        {/* Header row with days of the week */}
        <div className="grid grid-cols-8 bg-muted">
          <div className="p-2 border-r text-center font-medium text-sm">Time</div>
          {weekDays.map((day, index) => (
            <div key={index} className="p-2 border-r last:border-r-0 text-center font-medium text-sm">
              <div>{format(day, 'EEE')}</div>
              <div>{format(day, 'd')}</div>
            </div>
          ))}
        </div>
        
        {/* Time slots grid */}
        <div ref={gridRef} className="max-h-[500px] overflow-y-auto">
          {timeSlots.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-8 border-t">
              {/* Time column */}
              <div className="p-2 border-r text-sm text-center">
                {row[0].time}
              </div>
              
              {/* Days columns */}
              {row.map((slot, colIndex) => (
                <div
                  key={colIndex}
                  className={cn(
                    "h-8 border-r last:border-r-0 hover:bg-muted/60 cursor-pointer transition-colors",
                    slot.selected && "bg-usc-gold/30"
                  )}
                  onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                  onMouseMove={() => handleMouseMove(rowIndex, colIndex)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-4 text-sm text-muted-foreground">
        Click and drag to select available time slots
      </div>
    </div>
  );
};
