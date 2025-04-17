
import React from 'react';
import { BookingSlot } from "@/lib/scheduling/types";
import { isSameDay, format } from 'date-fns';
import { useScheduling } from '@/contexts/SchedulingContext';
import { cn } from "@/lib/utils";
import { formatTimeDisplay } from "@/lib/scheduling/time-utils";

interface CalendlyTimeSlotsProps {
  availableSlots: BookingSlot[];
}

export function CalendlyTimeSlots({ availableSlots }: CalendlyTimeSlotsProps) {
  const { state, dispatch } = useScheduling();
  const { selectedDate, selectedTimeSlot } = state;
  
  if (!selectedDate) {
    return (
      <div className="py-6 text-center text-muted-foreground">
        Please select a date to view available time slots.
      </div>
    );
  }
  
  const slotsForSelectedDate = availableSlots.filter(slot => 
    isSameDay(slot.day, selectedDate) && slot.available
  ).sort((a, b) => a.start.localeCompare(b.start));
  
  if (slotsForSelectedDate.length === 0) {
    return (
      <div className="py-6">
        <h2 className="text-2xl font-bold mb-4">Select a Time</h2>
        <div className="text-center py-8 border rounded-lg">
          <p className="text-muted-foreground">
            No available time slots for this date. Please select another date.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold mb-6">Select a Time</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {slotsForSelectedDate.map((slot, index) => (
          <button
            key={index}
            onClick={() => dispatch({ type: 'SELECT_TIME_SLOT', payload: slot })}
            className={cn(
              "p-4 rounded-lg border text-center transition-colors",
              selectedTimeSlot && isSameDay(selectedTimeSlot.day, slot.day) && 
              selectedTimeSlot.start === slot.start ? 
                "bg-usc-cardinal text-white border-usc-cardinal" : 
                "bg-white hover:bg-gray-50"
            )}
          >
            {formatTimeDisplay(slot.start)}
          </button>
        ))}
      </div>
    </div>
  );
}
