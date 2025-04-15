
import React from 'react';
import { Calendar } from "@/components/ui/calendar";

export interface DateSelectorProps {
  selectedDate?: Date;
  onDateChange: (date: Date) => void;
  availableDates?: Date[];
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

export function DateSelector({
  selectedDate,
  onDateChange,
  availableDates = [],
  disabled = false,
  minDate = new Date(),
  maxDate
}: DateSelectorProps) {
  return (
    <div className="p-1">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && onDateChange(date)}
        disabled={(date) => {
          // Disable dates before today
          if (date < minDate) return true;
          
          // Disable dates after maxDate if provided
          if (maxDate && date > maxDate) return true;
          
          // If availableDates is provided, only enable those dates
          if (availableDates.length > 0) {
            return !availableDates.some(
              availableDate => 
                availableDate.getFullYear() === date.getFullYear() &&
                availableDate.getMonth() === date.getMonth() &&
                availableDate.getDate() === date.getDate()
            );
          }
          
          return false;
        }}
        className="rounded-md border"
      />
    </div>
  );
}
