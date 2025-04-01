
import React from 'react';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { useScheduling } from '@/contexts/SchedulingContext';

interface CalendarProps {
  availableDates: Date[];
}

export const Calendar: React.FC<CalendarProps> = ({ availableDates }) => {
  const { state, dispatch } = useScheduling();
  const { selectedDate } = state;

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      dispatch({ type: 'SELECT_DATE', payload: date });
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">Select a Date</h3>
      <div className="border rounded-md p-3">
        <CalendarComponent
          mode="single"
          selected={selectedDate || undefined}
          onSelect={handleSelect}
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
          initialFocus
        />
      </div>
    </div>
  );
};
