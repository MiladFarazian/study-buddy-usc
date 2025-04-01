
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfDay } from 'date-fns';
import { BookingSlot, formatDateForDisplay } from "@/lib/scheduling";
import { useScheduling } from "@/contexts/SchedulingContext";
import { TimeSlot } from "@/lib/scheduling/ui/TimeSelector";
import { Loader2, Clock } from "lucide-react";

interface DateSelectionStepProps {
  availableSlots: BookingSlot[];
  isLoading: boolean;
}

export const DateSelectionStep: React.FC<DateSelectionStepProps> = ({
  availableSlots,
  isLoading
}) => {
  const { state, dispatch } = useScheduling();
  const { selectedDate, selectedTimeSlot } = state;

  const [visibleTimeSlots, setVisibleTimeSlots] = useState<TimeSlot[]>([]);
  
  // Extract unique dates from available slots
  const availableDates = Array.from(
    new Set(
      availableSlots
        .filter(slot => slot.available)
        .map(slot => format(slot.day, 'yyyy-MM-dd'))
    )
  ).map(dateStr => new Date(dateStr));
  
  // When selectedDate changes, filter time slots for that date
  useEffect(() => {
    if (selectedDate) {
      const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');
      
      const slotsForDate = availableSlots
        .filter(slot => format(slot.day, 'yyyy-MM-dd') === formattedSelectedDate)
        .map(slot => ({
          time: slot.start,
          available: slot.available
        }))
        .sort((a, b) => a.time.localeCompare(b.time));
      
      setVisibleTimeSlots(slotsForDate);
    }
  }, [selectedDate, availableSlots]);
  
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      dispatch({ type: 'SELECT_DATE', payload: startOfDay(date) });
      
      // Clear selected time slot when date changes
      dispatch({ type: 'SELECT_TIME_SLOT', payload: null });
    }
  };
  
  const handleTimeSelect = (time: string) => {
    if (selectedDate) {
      const slot = availableSlots.find(s => 
        format(s.day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') && 
        s.start === time
      );
      
      if (slot) {
        dispatch({ type: 'SELECT_TIME_SLOT', payload: slot });
      }
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Select a Date & Time</h2>
        <p className="text-muted-foreground">
          Choose when you'd like to schedule your tutoring session
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-sm font-medium mb-2">Select a Date:</p>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
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
            className="rounded-md border"
          />
        </div>
        
        <div>
          <p className="text-sm font-medium mb-2">Available Time Slots:</p>
          <div className="h-64 overflow-y-auto pr-2 border rounded-md p-2">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
                <span>Loading time slots...</span>
              </div>
            ) : !selectedDate ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <p>Please select a date first</p>
              </div>
            ) : visibleTimeSlots.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <p>No available time slots for this date</p>
                <p className="text-sm mt-1">Please select another date</p>
              </div>
            ) : (
              <div className="space-y-2">
                {visibleTimeSlots.map((slot, index) => {
                  const isSelected = selectedTimeSlot?.start === slot.time &&
                    selectedDate && selectedTimeSlot?.day &&
                    format(selectedDate, 'yyyy-MM-dd') === format(selectedTimeSlot.day, 'yyyy-MM-dd');
                  
                  // Convert to 12-hour format
                  const [hours, minutes] = slot.time.split(':').map(Number);
                  const period = hours >= 12 ? 'PM' : 'AM';
                  const hour12 = hours % 12 || 12;
                  const formattedTime = `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
                  
                  return (
                    <div
                      key={`${slot.time}-${index}`}
                      className={`
                        rounded-md border p-3 cursor-pointer transition-colors
                        ${isSelected
                          ? 'border-usc-cardinal bg-red-50'
                          : 'hover:border-usc-cardinal hover:bg-red-50/50'
                        }
                      `}
                      onClick={() => handleTimeSelect(slot.time)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="font-medium">{formattedTime}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {selectedDate && selectedTimeSlot && (
        <div className="mt-4 p-3 border rounded-md bg-muted/30">
          <p className="font-medium">Selected Time Slot:</p>
          <p className="mt-1">
            {selectedDate && formatDateForDisplay(selectedDate)} at {selectedTimeSlot.start}
          </p>
        </div>
      )}
    </div>
  );
};
