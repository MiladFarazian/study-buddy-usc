
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BookingSlot } from "@/lib/scheduling/types";
import { useScheduling } from '@/contexts/SchedulingContext';
import { DateSelector } from "@/components/scheduling/booking-modal/date-selector/DateSelector";
import { TimeSelector } from "@/lib/scheduling/ui/TimeSelector";

interface DateSelectionStepProps {
  availableSlots: BookingSlot[];
  isLoading: boolean;
}

export function DateSelectionStep({ availableSlots, isLoading }: DateSelectionStepProps) {
  const { state, dispatch, continueToNextStep } = useScheduling();
  const { selectedDate, selectedTimeSlot } = state;
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Function to determine which dates have available slots
  const getDatesWithSlots = () => {
    const datesMap = new Map<string, Date>();
    
    availableSlots.forEach(slot => {
      if (slot.available) {
        const slotDay = slot.day instanceof Date ? slot.day : new Date(slot.day);
        const dateStr = format(slotDay, 'yyyy-MM-dd');
        if (!datesMap.has(dateStr)) {
          datesMap.set(dateStr, slotDay);
        }
      }
    });
    
    return Array.from(datesMap.values());
  };
  
  const datesWithSlots = getDatesWithSlots();
  
  // Get available time slots for the selected date
  const getTimeSlots = () => {
    if (!selectedDate) return [];
    
    const slots = availableSlots.filter(slot => {
      const slotDay = slot.day instanceof Date ? slot.day : new Date(slot.day);
      return (
        slot.available && 
        slotDay.getDate() === selectedDate.getDate() &&
        slotDay.getMonth() === selectedDate.getMonth() &&
        slotDay.getFullYear() === selectedDate.getFullYear()
      );
    });
    
    // Convert booking slots to time slots for the TimeSelector component
    return slots.map(slot => ({
      time: slot.start,
      available: slot.available
    }));
  };
  
  const handleDateSelect = (date: Date | undefined) => {
    setCalendarOpen(false);
    if (date) {
      dispatch({ type: 'SELECT_DATE', payload: date });
    }
  };
  
  const handleTimeSelect = (time: string) => {
    const slot = availableSlots.find(s => {
      const slotDay = s.day instanceof Date ? s.day : new Date(s.day);
      const sameDay = selectedDate && format(slotDay, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
      return sameDay && s.start === time;
    });
    
    if (slot) {
      dispatch({ type: 'SELECT_TIME_SLOT', payload: slot });
    }
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Select Date & Time</h2>
      
      <div className="space-y-4">
        <DateSelector 
          date={selectedDate} 
          onDateChange={(date) => dispatch({ type: 'SELECT_DATE', payload: date })}
          availableSlots={availableSlots}
          isLoading={isLoading}
        />
        
        {selectedDate && !isLoading && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Available Times</h3>
            <TimeSelector
              availableTimes={getTimeSlots()}
              selectedTime={selectedTimeSlot?.start}
              onSelectTime={handleTimeSelect}
            />
          </div>
        )}
        
        {selectedDate && selectedTimeSlot && (
          <div className="mt-6 flex justify-end">
            <Button 
              className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
              onClick={continueToNextStep}
            >
              Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
