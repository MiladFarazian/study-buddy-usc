
import React from 'react';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarHeaderProps {
  startDate: Date;
  weekDays: Date[];
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  startDate,
  weekDays,
  onPrevWeek,
  onNextWeek
}) => {
  const startMonth = format(weekDays[0], 'MMMM');
  const endMonth = format(weekDays[weekDays.length - 1], 'MMMM');
  const startYear = format(weekDays[0], 'yyyy');
  const endYear = format(weekDays[weekDays.length - 1], 'yyyy');
  
  const dateRangeText = startMonth === endMonth
    ? `${startMonth} ${format(weekDays[0], 'd')} - ${format(weekDays[weekDays.length - 1], 'd')}, ${startYear}`
    : `${startMonth} ${format(weekDays[0], 'd')} - ${endMonth} ${format(weekDays[weekDays.length - 1], 'd')}, ${endYear}`;
  
  return (
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-medium">{dateRangeText}</h3>
      <div className="flex space-x-2">
        <Button variant="outline" size="icon" onClick={onPrevWeek}>
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous week</span>
        </Button>
        <Button variant="outline" size="icon" onClick={onNextWeek}>
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next week</span>
        </Button>
      </div>
    </div>
  );
};
