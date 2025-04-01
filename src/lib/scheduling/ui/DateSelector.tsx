
import React from 'react';
import { format } from 'date-fns';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DateSelectorProps {
  selectedDate?: Date;
  onSelectDate: (date: Date) => void;
  availableDates: Date[];
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  onSelectDate,
  availableDates
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select a Date</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && onSelectDate(date)}
            disabled={(date) => {
              // Disable dates before today
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              if (date < today) return true;
              
              // Disable dates not in the available dates list
              return !availableDates.some(d => format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
            }}
            className="rounded-md border shadow-sm"
          />
          
          {selectedDate && (
            <div className="mt-4 text-center">
              <p className="font-medium">Selected Date:</p>
              <p>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
