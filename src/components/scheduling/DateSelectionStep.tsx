
import { useState, useEffect, useMemo } from 'react';
import { BookingSlot } from "@/lib/scheduling";
import { useScheduling } from "@/contexts/SchedulingContext";
import { format, isSameDay } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

interface DateSelectionStepProps {
  availableSlots: BookingSlot[];
  isLoading: boolean;
}

export function DateSelectionStep({ availableSlots, isLoading }: DateSelectionStepProps) {
  const { state, dispatch } = useScheduling();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(state.selectedDate || undefined);

  // Extract all available dates from the available slots
  const availableDates = useMemo(() => {
    const uniqueDates = new Set<string>();
    const dates: Date[] = [];
    
    availableSlots.forEach(slot => {
      if (slot.available) {
        const dateString = format(slot.day, 'yyyy-MM-dd');
        if (!uniqueDates.has(dateString)) {
          uniqueDates.add(dateString);
          dates.push(new Date(slot.day));
        }
      }
    });
    
    return dates;
  }, [availableSlots]);

  // Helper function to check if a date has available slots
  const isDateAvailable = (date: Date) => {
    return availableDates.some(availableDate => 
      isSameDay(availableDate, date)
    );
  };

  // Update local state when context state changes
  useEffect(() => {
    if (state.selectedDate) {
      setSelectedDate(state.selectedDate);
    }
  }, [state.selectedDate]);

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date && isDateAvailable(date)) {
      setSelectedDate(date);
      dispatch({ type: 'SELECT_DATE', payload: date });
    }
  };

  // Handle continue button click
  const handleContinue = () => {
    if (selectedDate) {
      dispatch({ type: 'SET_STEP', payload: 'time' });
    }
  };

  // Handle back button click
  const handleBack = () => {
    dispatch({ type: 'RESET' });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Select a Date</h2>
      
      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabled={(date) => !isDateAvailable(date)}
          className="rounded-md border"
        />
      </div>
      
      <div className="mt-6 flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleBack}
        >
          Back
        </Button>
        <Button 
          onClick={handleContinue}
          disabled={!selectedDate}
          className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
