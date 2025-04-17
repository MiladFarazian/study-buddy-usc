
import React, { useState } from 'react';
import { format, isSameDay, addDays, subDays, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DateSelectorProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date) => void;
  availableDates: Date[];
}

export function DateSelector({ selectedDate, onDateChange, availableDates }: DateSelectorProps) {
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const today = new Date();
  
  const handlePrevWeek = () => {
    setViewDate(prevDate => subDays(prevDate, 7));
  };
  
  const handleNextWeek = () => {
    setViewDate(prevDate => addDays(prevDate, 7));
  };
  
  // Show weekly view header with dates
  const weekStart = startOfWeek(viewDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <Button variant="outline" size="sm" onClick={handlePrevWeek}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous Week
        </Button>
        <span className="font-medium">
          {format(weekStart, 'MMM d')} - {format(endOfWeek(viewDate, { weekStartsOn: 0 }), 'MMM d, yyyy')}
        </span>
        <Button variant="outline" size="sm" onClick={handleNextWeek}>
          Next Week
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => {
          const hasAvailability = availableDates.some(date => isSameDay(date, day));
          const isSelected = selectedDate && isSameDay(selectedDate, day);
          const isBeforeToday = day < new Date(today.setHours(0, 0, 0, 0));
          
          return (
            <div key={day.toISOString()} className="flex flex-col items-center">
              <div className="text-sm text-muted-foreground mb-1">
                {format(day, 'EEE')}
              </div>
              <button
                type="button"
                disabled={isBeforeToday || !hasAvailability}
                onClick={() => hasAvailability && onDateChange(day)}
                className={cn(
                  "w-12 h-12 flex items-center justify-center rounded-full",
                  isSelected ? "bg-usc-cardinal text-white" : "hover:bg-gray-100",
                  isBeforeToday || !hasAvailability ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
                  hasAvailability && !isSelected ? "border-2 border-dashed border-usc-cardinal/30" : ""
                )}
              >
                {format(day, 'd')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
