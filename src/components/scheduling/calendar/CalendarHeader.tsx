
import React from 'react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  // Format the date range for display
  const formatDateRange = () => {
    if (weekDays.length === 0) return '';
    
    const firstDay = weekDays[0];
    const lastDay = weekDays[weekDays.length - 1];
    
    // If the days are in the same month
    if (firstDay.getMonth() === lastDay.getMonth()) {
      return `${format(firstDay, 'MMMM d')} - ${format(lastDay, 'd, yyyy')}`;
    }
    
    // If the days span different months
    return `${format(firstDay, 'MMM d')} - ${format(lastDay, 'MMM d, yyyy')}`;
  };
  
  return (
    <div className="flex justify-between items-center mb-4">
      <h3 className="font-medium">{formatDateRange()}</h3>
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" onClick={onPrevWeek}>
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous Week</span>
        </Button>
        <Button variant="outline" size="sm" onClick={onNextWeek}>
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next Week</span>
        </Button>
      </div>
    </div>
  );
};
