
import React from 'react';
import { format } from 'date-fns';

interface CalendarDaysHeaderProps {
  weekDays: Date[];
}

export const CalendarDaysHeader: React.FC<CalendarDaysHeaderProps> = ({ weekDays }) => {
  // Add a safety check to ensure weekDays is an array
  if (!Array.isArray(weekDays) || weekDays.length === 0) {
    console.error("CalendarDaysHeader: weekDays is not a valid array", weekDays);
    return (
      <div className="grid grid-cols-1 bg-muted">
        <div className="p-1 md:p-2 border-r text-center font-medium text-xs md:text-sm">
          No dates available
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-8 bg-muted">
      <div className="p-1 md:p-2 border-r text-center font-medium text-xs md:text-sm">Time</div>
      {weekDays.map((day, index) => (
        <div 
          key={index} 
          className="p-1 md:p-2 border-r last:border-r-0 text-center font-medium text-xs md:text-sm"
          title={format(day, 'PPPP')} // Full date format for tooltip
        >
          <div>{format(day, 'EEE')}</div>
          <div>{format(day, 'd MMM')}</div>
        </div>
      ))}
    </div>
  );
};
