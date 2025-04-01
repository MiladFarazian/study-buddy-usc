
import React from 'react';
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { Card, CardContent } from "@/components/ui/card";

interface DateSelectorProps {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date) => void;
  availableDates: Date[];
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  onSelectDate,
  availableDates
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Select a Date</h3>
      <Card>
        <CardContent className="p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && onSelectDate(date)}
            disabled={(date) => {
              // Disable dates before today
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              if (date < today) return true;
              
              // Check if date has available slots
              return !availableDates.some(availableDate => 
                format(availableDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
              );
            }}
            className="rounded-md"
            initialFocus
          />
        </CardContent>
      </Card>
    </div>
  );
};
