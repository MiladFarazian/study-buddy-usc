
import React from 'react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from "lucide-react";

interface DateSelectorProps {
  selectedDate?: Date;
  onDateChange: (date: Date) => void;
  availableDates: Date[];
}

export function DateSelector({ selectedDate, onDateChange, availableDates }: DateSelectorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Select a Date</h2>
      
      <div className="border rounded-lg p-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onDateChange(date)}
          disabled={(date) => {
            // Disable dates with no availability
            const formattedDate = format(date, 'yyyy-MM-dd');
            return !availableDates.some(
              (availableDate) => format(availableDate, 'yyyy-MM-dd') === formattedDate
            );
          }}
          className="rounded-md"
        />
      </div>
      
      {selectedDate && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">You selected:</p>
          <div className="inline-flex items-center justify-center bg-muted px-3 py-1 rounded-md mt-1">
            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default DateSelector;
