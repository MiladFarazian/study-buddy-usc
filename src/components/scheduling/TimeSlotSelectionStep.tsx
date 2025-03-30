
import { useState, useMemo } from 'react';
import { BookingSlot } from "@/lib/scheduling";
import { useScheduling, BookingStep } from "@/contexts/SchedulingContext";
import { format, isSameDay, parseISO } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { convertTimeToMinutes, convertMinutesToTime, formatTimeDisplay } from "@/lib/scheduling/time-utils";

interface TimeSlotSelectionStepProps {
  availableSlots: BookingSlot[];
  isLoading: boolean;
}

export function TimeSlotSelectionStep({ availableSlots, isLoading }: TimeSlotSelectionStepProps) {
  const { state, dispatch } = useScheduling();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<BookingSlot | null>(state.selectedTimeSlot);
  const [selectedDuration, setSelectedDuration] = useState<number>(state.selectedDuration);

  // Filter slots for the selected date
  const availableTimeSlotsForDate = useMemo(() => {
    if (!state.selectedDate) return [];
    
    return availableSlots.filter(slot => 
      isSameDay(new Date(slot.day), state.selectedDate) && slot.available
    );
  }, [availableSlots, state.selectedDate]);

  // Handle time slot selection
  const handleTimeSlotSelect = (slot: BookingSlot) => {
    setSelectedTimeSlot(slot);
    dispatch({ type: 'SELECT_TIME_SLOT', payload: slot });
  };

  // Handle back button click
  const handleBack = () => {
    dispatch({ type: 'SET_STEP', payload: BookingStep.SELECT_DATE_TIME });
  };

  // Handle continue button click
  const handleContinue = () => {
    if (selectedTimeSlot) {
      dispatch({ type: 'SET_DURATION', payload: selectedDuration });
      dispatch({ type: 'SET_STEP', payload: BookingStep.SELECT_DURATION });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal" />
      </div>
    );
  }

  if (availableTimeSlotsForDate.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground mb-4">No available time slots for this date.</p>
        <Button onClick={handleBack} variant="outline">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Select a Time</h2>
      
      <div className="grid grid-cols-2 gap-2">
        {availableTimeSlotsForDate.map((slot, index) => (
          <Button
            key={index}
            variant="outline"
            className={`p-4 h-auto flex flex-col items-center justify-center ${
              selectedTimeSlot && 
              selectedTimeSlot.start === slot.start && 
              selectedTimeSlot.end === slot.end
                ? 'bg-usc-cardinal text-white border-usc-cardinal'
                : ''
            }`}
            onClick={() => handleTimeSlotSelect(slot)}
          >
            <span className="font-medium">
              {formatTimeDisplay(slot.start)} - {formatTimeDisplay(slot.end)}
            </span>
            <span className="text-xs mt-1">
              {Math.round((convertTimeToMinutes(slot.end) - convertTimeToMinutes(slot.start)) / 60 * 10) / 10} hours
            </span>
          </Button>
        ))}
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
          disabled={!selectedTimeSlot}
          className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
