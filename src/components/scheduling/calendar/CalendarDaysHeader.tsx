
import React from 'react';
import { format } from 'date-fns';

interface CalendarDaysHeaderProps {
  weekDays: Date[];
}

export const CalendarDaysHeader: React.FC<CalendarDaysHeaderProps> = ({ weekDays }) => {
  return (
    <div className="grid grid-cols-8 border-b bg-muted/30">
      <div className="p-2 text-center font-medium">Time</div>
      {weekDays.map((day, index) => (
        <div key={index} className="p-2 text-center font-medium border-l">
          <div>{format(day, 'EEE')}</div>
          <div className="text-sm font-normal">{format(day, 'MMM d')}</div>
        </div>
      ))}
    </div>
  );
};
