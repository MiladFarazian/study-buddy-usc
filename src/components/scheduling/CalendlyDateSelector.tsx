
import React, { useState, useEffect } from 'react';
import { 
  format, 
  addDays, 
  subDays, 
  isToday, 
  isSameDay, 
  startOfWeek, 
  addWeeks
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useScheduling } from '@/contexts/SchedulingContext';
import { CalendarViewMode } from '@/lib/scheduling/types';

interface CalendlyDateSelectorProps {
  availableDates: Date[];
  showWeekMonth?: boolean;
}

export function CalendlyDateSelector({ 
  availableDates, 
  showWeekMonth = true 
}: CalendlyDateSelectorProps) {
  const { state, dispatch } = useScheduling();
  const { selectedDate } = state;
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  
  // Generate array of dates to display
  const [displayedDates, setDisplayedDates] = useState<Date[]>([]);
  
  useEffect(() => {
    // Generate 14 days from current date
    const dates = Array.from({ length: 14 }, (_, i) => addDays(currentDate, i));
    setDisplayedDates(dates);
  }, [currentDate]);
  
  const handlePrevious = () => {
    if (viewMode === 'week') {
      setCurrentDate(prevDate => subDays(prevDate, 7));
    } else {
      // Move back by 30 days for month view
      setCurrentDate(prevDate => subDays(prevDate, 30));
    }
  };
  
  const handleNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(prevDate => addDays(prevDate, 7));
    } else {
      // Move forward by 30 days for month view
      setCurrentDate(prevDate => addDays(prevDate, 30));
    }
  };
  
  const handleDateSelect = (date: Date) => {
    // Check if date is in available dates
    const isAvailable = availableDates.some(availableDate => 
      isSameDay(availableDate, date)
    );
    
    if (isAvailable) {
      dispatch({ type: 'SELECT_DATE', payload: date });
    }
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
    // If today is available, select it
    const today = new Date();
    const isTodayAvailable = availableDates.some(date => isSameDay(date, today));
    
    if (isTodayAvailable) {
      dispatch({ type: 'SELECT_DATE', payload: today });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Select a Date</h2>
        
        {showWeekMonth && (
          <Tabs 
            defaultValue="week" 
            value={viewMode} 
            onValueChange={(value) => setViewMode(value as CalendarViewMode)}
          >
            <TabsList className="grid grid-cols-2 w-[160px]">
              <TabsTrigger value="week">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Week
              </TabsTrigger>
              <TabsTrigger value="month">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Month
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <div className="flex justify-between items-center p-3 border-b">
          <Button variant="ghost" size="icon" onClick={handlePrevious}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <span className="font-medium text-lg">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          
          <Button variant="ghost" size="icon" onClick={handleNext}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-3">
          <div className="overflow-x-auto">
            <div className="flex min-w-max">
              {displayedDates.map((date, index) => {
                const dayName = format(date, 'EEE');
                const dayNumber = format(date, 'd');
                const isAvailable = availableDates.some(availableDate => 
                  isSameDay(availableDate, date)
                );
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                
                return (
                  <div key={index} className="flex flex-col items-center px-4 py-2">
                    <span className="text-sm text-muted-foreground mb-1">{dayName}</span>
                    <Button
                      variant="ghost"
                      className={cn(
                        "h-10 w-10 rounded-full p-0 font-normal",
                        isToday(date) && "bg-muted font-medium",
                        isSelected && "bg-usc-cardinal text-white hover:bg-usc-cardinal",
                        !isAvailable && "opacity-50 cursor-not-allowed"
                      )}
                      disabled={!isAvailable}
                      onClick={() => handleDateSelect(date)}
                    >
                      {dayNumber}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-full"
              onClick={handleToday}
            >
              Today
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
