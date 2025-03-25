
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
                const isAvailable = slot?.available;
                const isSelected = selectedSlot && 
                                   format(selectedSlot.day, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') && 
                                   selectedSlot.start === timeString;
                const isInDrag = isInDragRange(hour, minute, dayIndex);
                
                return (
                  <div
                    key={`${timeString}-${dayIndex}`}
                    className={cn(
                      "h-6 md:h-8 border-r last:border-r-0 transition-colors cursor-default",
                      isAvailable ? "cursor-pointer hover:bg-green-50" : "bg-gray-100 opacity-50",
                      isSelected ? "bg-usc-cardinal text-white" : "",
                      isInDrag && isAvailable ? "bg-usc-gold" : ""
                    )}
                    onMouseDown={() => isAvailable && handleMouseDown(hour, minute, dayIndex)}
                    onMouseMove={() => handleMouseMove(hour, minute, dayIndex)}
                    onTouchStart={() => isAvailable && handleMouseDown(hour, minute, dayIndex)}
                    onTouchMove={() => handleMouseMove(hour, minute, dayIndex)}
                  >
                    {minute === 0 && isAvailable && (
                      <div className="h-1 w-full bg-green-500"></div>
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
