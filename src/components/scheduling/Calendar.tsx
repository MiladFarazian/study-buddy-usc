
import React from 'react';
import { format, isSameDay, isBefore, addDays } from 'date-fns';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { useScheduling } from '@/contexts/SchedulingContext';

interface CalendarProps {
  availableDates?: Date[];
}

export function Calendar({ availableDates }: CalendarProps) {
  const { state, dispatch } = useScheduling();
  const { selectedDate } = state;
  
  // Helper function to check if a date has available slots
  const isDateAvailable = (date: Date) => {
    if (!availableDates || availableDates.length === 0) {
      // If no specific available dates, allow any date that's not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return !isBefore(date, today);
    }
    
    return availableDates.some(availableDate => 
      isSameDay(availableDate, date)
    );
  };

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date && isDateAvailable(date)) {
      dispatch({ type: 'SELECT_DATE', payload: date });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Select a Date</h2>
      
      <div className="flex justify-center">
        <CalendarUI
          mode="single"
          selected={selectedDate || undefined}
          onSelect={handleDateSelect}
          disabled={(date) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return isBefore(date, today) || !isDateAvailable(date);
          }}
          className="rounded-md border"
        />
      </div>
    </div>
  );
}
