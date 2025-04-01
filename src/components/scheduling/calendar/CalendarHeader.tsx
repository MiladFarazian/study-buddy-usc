
import React from 'react';
import { format, addDays } from 'date-fns';
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
  return (
    <div className="flex justify-between items-center mb-4">
      <Button variant="outline" size="sm" onClick={onPrevWeek}>
        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
      </Button>
      <h3 className="text-lg font-medium hidden md:block">
        Week of {format(startDate, 'MMM d, yyyy')}
      </h3>
      <span className="text-sm text-center md:hidden">
        {format(startDate, 'MMM d')} - {format(addDays(startDate, 6), 'MMM d')}
      </span>
      <Button variant="outline" size="sm" onClick={onNextWeek}>
        Next <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
};
