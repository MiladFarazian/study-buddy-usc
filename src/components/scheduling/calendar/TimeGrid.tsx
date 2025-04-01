
import React from 'react';
import { BookingSlot } from '@/types/scheduling';
import { getFormattedTime } from '@/lib/scheduling';

interface TimeGridProps {
  hours: number[];
  weekDays: Date[];
  getSlotAt: (dayIndex: number, hour: number) => BookingSlot | null;
  handleMouseDown: (dayIndex: number, hour: number) => void;
  handleMouseMove: (dayIndex: number, hour: number) => void;
  selectedSlot: BookingSlot | null;
  isInDragRange: (dayIndex: number, hour: number) => boolean;
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
    <div className="grid grid-cols-8 divide-y divide-gray-200">
      {hours.map(hour => (
        <React.Fragment key={hour}>
          {/* Time column */}
          <div className="p-2 text-center text-xs text-gray-500">
            {getFormattedTime(`${hour}:00`)}
          </div>
          
          {/* Day columns */}
          {weekDays.map((day, dayIndex) => {
            const slot = getSlotAt(day.getDay(), hour);
            const isSelected = selectedSlot && 
              slot && 
              selectedSlot.day.getTime() === slot.day.getTime() && 
              selectedSlot.start === slot.start;
            
            const inDragRange = isInDragRange(day.getDay(), hour);
            
            return (
              <div
                key={`${dayIndex}-${hour}`}
                className={`
                  border-l p-1 h-12 relative
                  ${slot?.available ? 'cursor-pointer hover:bg-red-50' : 'bg-gray-50 cursor-not-allowed'}
                  ${isSelected ? 'bg-red-200' : ''}
                  ${inDragRange && !isSelected ? 'bg-red-100' : ''}
                `}
                onMouseDown={() => slot?.available && handleMouseDown(day.getDay(), hour)}
                onMouseMove={() => handleMouseMove(day.getDay(), hour)}
              >
                {slot?.available && (
                  <div className="text-xs">
                    {getFormattedTime(slot.start)} - {getFormattedTime(slot.end)}
                  </div>
                )}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};
