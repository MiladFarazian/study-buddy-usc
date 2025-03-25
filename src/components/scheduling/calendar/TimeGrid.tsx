
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
  // Helper function to check if a slot is part of a range
  const isPartOfAvailabilityRange = (day: Date, hour: number, minute: number): boolean => {
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const slot = getSlotAt(day, timeString);
    
    if (!slot || !slot.available) return false;
    
    // Find the start and end times of the availability range this slot belongs to
    const startHour = parseInt(slot.start.split(':')[0]);
    const startMinute = parseInt(slot.start.split(':')[1]);
    const endHour = parseInt(slot.end.split(':')[0]);
    const endMinute = parseInt(slot.end.split(':')[1]);
    
    // Convert current cell time to minutes for comparison
    const cellTimeInMinutes = hour * 60 + minute;
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;
    
    // Check if this cell is within the range
    return cellTimeInMinutes >= startTimeInMinutes && cellTimeInMinutes < endTimeInMinutes;
  };
  
  return (
    <div className="max-h-[400px] md:max-h-[500px] overflow-y-auto">
      {hours.map((hour) => (
        [0, 15, 30, 45].map((minute, minuteIndex) => {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          return (
            <div key={`${hour}-${minute}`} className="grid grid-cols-8 border-t">
              {/* Time column */}
              {minuteIndex === 0 && (
                <div className="p-1 md:p-2 border-r text-xs md:text-sm text-center row-span-4">
                  {format(new Date().setHours(hour, 0), 'h a')}
                </div>
              )}
              {minuteIndex !== 0 && <div className="p-1 md:p-2 border-r text-xs md:text-sm text-center invisible">.</div>}
              
              {/* Days columns */}
              {weekDays.map((day, dayIndex) => {
                const slot = getSlotAt(day, timeString);
                const isAvailable = isPartOfAvailabilityRange(day, hour, minute);
                const isSelected = selectedSlot && 
                                   format(selectedSlot.day, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') && 
                                   selectedSlot.start === timeString;
                const isInDrag = isInDragRange(hour, minute, dayIndex);
                
                // Check if this is the start of a slot (for display purposes)
                const isSlotStart = slot?.available && slot?.start === timeString;
                
                return (
                  <div
                    key={`${timeString}-${dayIndex}`}
                    className={cn(
                      "h-6 md:h-8 border-r last:border-r-0 transition-colors cursor-default",
                      isAvailable ? "cursor-pointer bg-usc-cardinal hover:bg-usc-cardinal-dark text-white" : "bg-gray-100 opacity-50",
                      isSelected ? "bg-usc-cardinal text-white" : "",
                      isInDrag && isAvailable ? "bg-usc-gold text-gray-800" : ""
                    )}
                    onMouseDown={() => isAvailable && handleMouseDown(hour, minute, dayIndex)}
                    onMouseMove={() => handleMouseMove(hour, minute, dayIndex)}
                    onTouchStart={() => isAvailable && handleMouseDown(hour, minute, dayIndex)}
                    onTouchMove={() => handleMouseMove(hour, minute, dayIndex)}
                  >
                    {isSlotStart && (
                      <div className="text-xs font-medium text-center">
                        {slot.start}
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
