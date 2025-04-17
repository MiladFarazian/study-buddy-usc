
import { useState, useMemo } from 'react';
import { BookingSlot } from "@/lib/scheduling/types/booking";
import { useScheduling, BookingStep } from "@/contexts/SchedulingContext";
import { format, isSameDay } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { formatTimeDisplay } from "@/lib/scheduling/time-utils";

interface TimeSlotSelectionStepProps {
  availableSlots: BookingSlot[];
  isLoading: boolean;
}

export function TimeSlotSelectionStep({ availableSlots, isLoading }: TimeSlotSelectionStepProps) {
  const { state, dispatch } = useScheduling();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<BookingSlot | null>(state.selectedTimeSlot);

  const availableTimeSlotsForDate = useMemo(() => {
    if (!state.selectedDate) return [];
    
    return availableSlots.filter(slot => 
      isSameDay(new Date(slot.day), state.selectedDate) && slot.available
    ).sort((a, b) => {
      return new Date(a.day).getTime() - new Date(b.day).getTime() || 
             a.start.localeCompare(b.start);
    });
  }, [availableSlots, state.selectedDate]);

  const handleTimeSlotSelect = (slot: BookingSlot) => {
    setSelectedTimeSlot(slot);
    dispatch({ type: 'SELECT_TIME_SLOT', payload: slot });
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', payload: BookingStep.SELECT_DATE_TIME });
  };

  const handleContinue = () => {
    if (selectedTimeSlot) {
      dispatch({ type: 'SET_DURATION', payload: state.selectedDuration });
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
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {availableTimeSlotsForDate.map((slot, index) => (
          <Button
            key={`${slot.start}-${index}`}
            variant="outline"
            className={`p-4 h-auto ${
              selectedTimeSlot && 
              selectedTimeSlot.start === slot.start && 
              selectedTimeSlot.end === slot.end
                ? 'bg-usc-cardinal text-white border-usc-cardinal'
                : ''
            }`}
            onClick={() => handleTimeSlotSelect(slot)}
          >
            <span className="font-medium">
              {formatTimeDisplay(slot.start)}
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
