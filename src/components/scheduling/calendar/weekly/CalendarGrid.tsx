
import React from 'react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

interface WeekDay {
  name: string;
  fullName: string;
  displayName: string;
}

interface CalendarGridProps {
  weekDays: WeekDay[];
  hours: number[];
  readOnly: boolean;
  isCellAvailable: (day: string, hour: number) => boolean;
  isInCurrentSelection: (day: string, hour: number) => boolean;
  selectionMode: 'add' | 'remove';
  onCellMouseDown: (day: string, hour: number) => void;
  onCellMouseEnter: (day: string, hour: number) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  weekDays,
  hours,
  readOnly,
  isCellAvailable,
  isInCurrentSelection,
  selectionMode,
  onCellMouseDown,
  onCellMouseEnter
}) => {
  return (
    <>
      <div className="grid grid-cols-[80px_repeat(7,1fr)]">
        <div className="h-16 border-b flex items-end justify-center pb-2 font-medium">
          Time
        </div>
        {weekDays.map((day, index) => (
          <div key={index} className="h-16 border-b flex items-center justify-center">
            <div className="font-medium">{day.displayName}</div>
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
            const isSelected = isInCurrentSelection(day.fullName, hour);
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
                onMouseDown={!readOnly ? () => onCellMouseDown(day.fullName, hour) : undefined}
                onMouseEnter={!readOnly ? () => onCellMouseEnter(day.fullName, hour) : undefined}
              />
            );
          })}
        </div>
      ))}
    </>
  );
};
