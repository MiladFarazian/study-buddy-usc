
import React from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format, addDays, startOfToday } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateSelectorProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onSelectDate }) => {
  const today = startOfToday();
  const [viewMode, setViewMode] = React.useState<'week' | 'month'>('week');
  const [weekStartDate, setWeekStartDate] = React.useState(today);
  
  // Generate week days for the weekly view
  const weekDays = React.useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const date = addDays(weekStartDate, i);
      return {
        date,
        day: format(date, 'EEE'),
        dayNum: format(date, 'd')
      };
    });
  }, [weekStartDate]);

  const handlePrevWeek = () => {
    setWeekStartDate(prev => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setWeekStartDate(prev => addDays(prev, 7));
  };

  const isDateSelected = (date: Date) => {
    return selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
  };

  const isToday = (date: Date) => {
    return format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  };

  return (
    <div className="w-full rounded-xl bg-white shadow-sm">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <h2 className="text-lg font-medium">Select a Date</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            className={viewMode === 'week' ? 'bg-muted' : ''}
            onClick={() => setViewMode('week')}
          >
            Week
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className={viewMode === 'month' ? 'bg-muted' : ''}
            onClick={() => setViewMode('month')}
          >
            Month
          </Button>
        </div>
      </div>
      
      {viewMode === 'week' ? (
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <Button variant="ghost" size="icon" onClick={handlePrevWeek}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h3 className="text-sm">
              {format(weekStartDate, 'MMMM yyyy')}
            </h3>
            <Button variant="ghost" size="icon" onClick={handleNextWeek}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="grid grid-cols-8 gap-2">
            {weekDays.map((dayInfo) => (
              <div key={dayInfo.date.toISOString()} className="text-center">
                <div className="text-xs text-muted-foreground mb-1">{dayInfo.day}</div>
                <button
                  onClick={() => onSelectDate(dayInfo.date)}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-colors
                    ${isDateSelected(dayInfo.date) 
                      ? 'bg-usc-cardinal text-white' 
                      : isToday(dayInfo.date)
                      ? 'bg-gray-100 font-semibold'
                      : 'hover:bg-gray-100'
                    }
                  `}
                >
                  {dayInfo.dayNum}
                </button>
              </div>
            ))}
          </div>
          
          {isToday(weekStartDate) && (
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onSelectDate(today)}
                className="text-xs"
              >
                Today
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6">
          <Calendar
            mode="single"
            selected={selectedDate || undefined}
            onSelect={(date) => date && onSelectDate(date)}
            className="rounded-md border p-3 pointer-events-auto"
            disabled={(date) => date < today}
          />
        </div>
      )}
    </div>
  );
};

export default DateSelector;
