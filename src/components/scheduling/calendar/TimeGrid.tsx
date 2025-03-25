
import React from 'react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { BookingSlot } from "@/lib/scheduling";

interface TimeGridProps {
  hours: number[];
  weekDays: Date[];
  getSlotAt: (day: Date, timeString: string) => BookingSlot | undefined;
  handleMouseDown: (hour: number, minute: number, dayIndex: number) => void;
  handleMouseMove: (hour: number, minute: number, dayIndex: number) => void;
  selectedSlot: BookingSlot | null;
  isInDragRange: (hour: number, minute: number, dayIndex: number) => boolean;
}

export const TimeGrid: React.FC<TimeGridProps> = ({
  hours,
  weekDays,
  getSlotAt,
  handleMouseDown,
  handleMouseMove,
  selectedSlot,
  isInDragRange
}) => {
  // Helper function to check if a cell belongs to an availability range
  const getCellAvailabilityStatus = (day: Date, hour: number, minute: number): {
    isAvailable: boolean;
    isSlotStart: boolean;
    slot?: BookingSlot;
  } => {
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    // This time in minutes for easier comparison
    const cellTimeInMinutes = hour * 60 + minute;
    
    // Look for an availability slot that contains this time
    for (let i = 0; i < 24 * 2; i++) { // 24 hours * 2 half-hours = 48 possible start times
      const checkHour = Math.floor(i / 2);
      const checkMinute = (i % 2) * 30;
      const checkTimeString = `${checkHour.toString().padStart(2, '0')}:${checkMinute.toString().padStart(2, '0')}`;
      
      const slot = getSlotAt(day, checkTimeString);
      if (!slot || !slot.available) continue;
      
      // Convert slot times to minutes for comparison
      const slotStartHour = parseInt(slot.start.split(':')[0]);
      const slotStartMinute = parseInt(slot.start.split(':')[1]);
      const slotEndHour = parseInt(slot.end.split(':')[0]);
      const slotEndMinute = parseInt(slot.end.split(':')[1]);
      
      const slotStartInMinutes = slotStartHour * 60 + slotStartMinute;
      const slotEndInMinutes = slotEndHour * 60 + slotEndMinute;
      
      // Check if this cell is within the slot's time range
      if (cellTimeInMinutes >= slotStartInMinutes && cellTimeInMinutes < slotEndInMinutes) {
        return {
          isAvailable: true,
          isSlotStart: timeString === slot.start,
          slot
        };
      }
    }
    
    return {
      isAvailable: false,
      isSlotStart: false
    };
  };

  // Function to check if a cell is selected
  const isCellSelected = (day: Date, hour: number, minute: number): boolean => {
    if (!selectedSlot) return false;
    
    const formattedSelectedDay = format(selectedSlot.day, 'yyyy-MM-dd');
    const formattedCurrentDay = format(day, 'yyyy-MM-dd');
    
    if (formattedSelectedDay !== formattedCurrentDay) return false;
    
    const cellTimeInMinutes = hour * 60 + minute;
    const selectedStartHour = parseInt(selectedSlot.start.split(':')[0]);
    const selectedStartMinute = parseInt(selectedSlot.start.split(':')[1]);
    const selectedEndHour = parseInt(selectedSlot.end.split(':')[0]);
    const selectedEndMinute = parseInt(selectedSlot.end.split(':')[1]);
    
    const selectedStartInMinutes = selectedStartHour * 60 + selectedStartMinute;
    const selectedEndInMinutes = selectedEndHour * 60 + selectedEndMinute;
    
    return cellTimeInMinutes >= selectedStartInMinutes && cellTimeInMinutes < selectedEndInMinutes;
  };
  
  return (
    <div className="max-h-[400px] md:max-h-[500px] overflow-y-auto">
      {hours.map((hour) => (
        [0, 30].map((minute, minuteIndex) => {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          return (
            <div key={`${hour}-${minute}`} className="grid grid-cols-8 border-t">
              {/* Time column */}
              {minuteIndex === 0 && (
                <div className="p-1 md:p-2 border-r text-xs md:text-sm text-center row-span-2">
                  {format(new Date().setHours(hour, 0), 'h a')}
                </div>
              )}
              {minuteIndex !== 0 && <div className="p-1 md:p-2 border-r text-xs md:text-sm text-center invisible">.</div>}
              
              {/* Days columns */}
              {weekDays.map((day, dayIndex) => {
                const { isAvailable, isSlotStart, slot } = getCellAvailabilityStatus(day, hour, minute);
                const isSelected = isCellSelected(day, hour, minute);
                const isInDrag = isInDragRange(hour, minute, dayIndex);
                
                return (
                  <div
                    key={`${timeString}-${dayIndex}`}
                    className={cn(
                      "h-12 md:h-16 border-r last:border-r-0 transition-colors cursor-default",
                      isAvailable ? "cursor-pointer bg-usc-cardinal hover:bg-usc-cardinal-dark text-white" : "bg-gray-100 opacity-50",
                      isSelected ? "bg-usc-cardinal-dark text-white" : "",
                      isInDrag && isAvailable ? "bg-usc-gold text-gray-800" : ""
                    )}
                    onMouseDown={() => handleMouseDown(hour, minute, dayIndex)}
                    onMouseMove={() => handleMouseMove(hour, minute, dayIndex)}
                    onTouchStart={() => handleMouseDown(hour, minute, dayIndex)}
                    onTouchMove={() => handleMouseMove(hour, minute, dayIndex)}
                  >
                    {isSlotStart && (
                      <div className="text-xs font-medium text-center pt-2">
                        {slot?.start}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })
      ))}
    </div>
  );
};
