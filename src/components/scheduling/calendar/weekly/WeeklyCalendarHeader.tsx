
import React from 'react';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface WeeklyCalendarHeaderProps {
  currentWeekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

export const WeeklyCalendarHeader: React.FC<WeeklyCalendarHeaderProps> = ({
  currentWeekStart,
  onPrevWeek,
  onNextWeek
}) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <Button variant="outline" size="sm" onClick={onPrevWeek}>
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
      </Button>
      
      <h3 className="text-lg font-medium">
        Week of {format(currentWeekStart, 'MMM d, yyyy')}
      </h3>
      
      <Button variant="outline" size="sm" onClick={onNextWeek}>
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
};
