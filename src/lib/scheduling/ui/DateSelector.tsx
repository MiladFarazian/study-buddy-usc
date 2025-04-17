
import React from 'react';
import { Calendar } from "@/components/ui/calendar";

export interface DateSelectorProps {
  selectedDate?: Date;
  onDateChange: (date: Date) => void;
  availableDates?: Date[];
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  // For backwards compatibility
  onSelectDate?: (date: Date) => void;
}

export function DateSelector({
  selectedDate,
  onDateChange,
  availableDates = [],
  disabled = false,
  minDate = new Date(),
  maxDate,
  onSelectDate, // For backwards compatibility
}: DateSelectorProps) {
  // Handle date selection, using onSelectDate if provided (for backward compatibility)
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      if (onSelectDate) {
        onSelectDate(date);
      }
      onDateChange(date);
    }
  };

  return (
    <div className="p-1">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={handleDateSelect}
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
