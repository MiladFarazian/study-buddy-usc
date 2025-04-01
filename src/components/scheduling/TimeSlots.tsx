
import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import { BookingSlot } from "@/lib/scheduling/types";
import { formatTimeDisplay } from "@/lib/scheduling/time-utils";
import { useScheduling } from '@/contexts/SchedulingContext';
import { isSameDay } from 'date-fns';

interface TimeSlotsProps {
  availableSlots: BookingSlot[];
}

export function TimeSlots({ availableSlots }: TimeSlotsProps) {
  const { state, dispatch } = useScheduling();
  const { selectedDate, selectedTimeSlot } = state;
  
  if (!selectedDate) {
    return (
      <div className="mt-4 text-center text-muted-foreground">
        Please select a date to view available time slots.
      </div>
    );
  }
  
  // Filter available slots for the selected date
  const slotsForSelectedDate = availableSlots.filter(slot => {
    return selectedDate && isSameDay(slot.day, selectedDate) && slot.available;
  });
  
  // Group slots by morning and afternoon
  const morningSlots = slotsForSelectedDate.filter(
    slot => parseInt(slot.start.split(':')[0]) < 12
  );
  
  const afternoonSlots = slotsForSelectedDate.filter(
    slot => parseInt(slot.start.split(':')[0]) >= 12
  );
  
  const handleSelectTimeSlot = (slot: BookingSlot) => {
    dispatch({ type: 'SELECT_TIME_SLOT', payload: slot });
  };
  
  if (slotsForSelectedDate.length === 0) {
    return (
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Select a Time</h2>
        <div className="flex flex-col items-center justify-center p-8 border rounded-md bg-muted/30">
          <Clock className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground text-center">
            No available time slots for this date. Please select another date.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mt-6 space-y-4">
      <h2 className="text-xl font-semibold">Select a Time</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {morningSlots.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Morning</h3>
            <div className="grid grid-cols-2 gap-2">
              {morningSlots.map((slot) => (
                <Button
                  key={`${slot.day.toISOString()}-${slot.start}-${slot.end}`}
                  variant="outline"
                  className={cn(
                    "justify-center",
                    selectedTimeSlot && selectedTimeSlot.start === slot.start && 
                    selectedTimeSlot.end === slot.end && 
                    isSameDay(selectedTimeSlot.day, slot.day) && 
                    "bg-usc-cardinal text-white border-usc-cardinal"
                  )}
                  onClick={() => handleSelectTimeSlot(slot)}
                >
                  {formatTimeDisplay(slot.start)}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {afternoonSlots.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Afternoon/Evening</h3>
            <div className="grid grid-cols-2 gap-2">
              {afternoonSlots.map((slot) => (
                <Button
                  key={`${slot.day.toISOString()}-${slot.start}-${slot.end}`}
                  variant="outline"
                  className={cn(
                    "justify-center",
                    selectedTimeSlot && selectedTimeSlot.start === slot.start && 
                    selectedTimeSlot.end === slot.end && 
                    isSameDay(selectedTimeSlot.day, slot.day) && 
                    "bg-usc-cardinal text-white border-usc-cardinal"
                  )}
                  onClick={() => handleSelectTimeSlot(slot)}
                >
                  {formatTimeDisplay(slot.start)}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
