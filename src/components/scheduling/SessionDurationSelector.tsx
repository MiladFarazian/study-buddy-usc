
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { DurationSelector } from "./DurationSelector";
import { useScheduling } from '@/contexts/SchedulingContext';
import { format } from 'date-fns';
import { CalendarIcon, ClockIcon } from "lucide-react";
import { WeeklyAvailability } from "@/lib/scheduling/types/availability";
import { getTutorAvailability } from "@/lib/scheduling/availability-manager";

export function SessionDurationSelector() {
  const { state, dispatch, calculatePrice, tutor, continueToNextStep, goToPreviousStep } = useScheduling();
  const { selectedDuration, selectedDate, selectedTimeSlot } = state;
  const [tutorAvailability, setTutorAvailability] = useState<WeeklyAvailability | null>(null);

  // Fetch tutor availability when component mounts
  useEffect(() => {
    if (tutor?.id) {
      getTutorAvailability(tutor.id).then(availability => {
        setTutorAvailability(availability);
      });
    }
  }, [tutor?.id]);
  
  const durationOptions = [
    { minutes: 30, display: "30 minutes" },
    { minutes: 60, display: "1 hour" },
    { minutes: 90, display: "1.5 hours" },
    { minutes: 120, display: "2 hours" }
  ];
  
  const handleSelectDuration = (duration: number) => {
    dispatch({ type: 'SET_DURATION', payload: duration });
  };
  
  // Use the tutor's hourly rate from their profile
  const hourlyRate = tutor?.hourlyRate || 25; // Default to $25 if not set
  
  return (
    <div className="space-y-6">
      {selectedDate && selectedTimeSlot && (
        <div className="bg-muted/30 p-4 rounded-md mb-6">
          <div className="flex items-center mb-2">
            <CalendarIcon className="h-5 w-5 mr-2 text-muted-foreground" />
            <span className="font-medium">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-muted-foreground" />
            <span className="font-medium">{selectedTimeSlot.start}</span>
          </div>
        </div>
      )}
      
      <DurationSelector
        options={durationOptions}
        selectedDuration={selectedDuration}
        onSelectDuration={handleSelectDuration}
        hourlyRate={hourlyRate}
        selectedStartTime={selectedTimeSlot?.start}
        selectedDate={selectedDate}
        tutorAvailability={tutorAvailability}
      />
      
      <div className="flex justify-between mt-8">
        <Button 
          variant="outline" 
          className="px-8"
          onClick={goToPreviousStep}
        >
          Back
        </Button>
        
        <Button 
          className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white px-8"
          onClick={continueToNextStep}
          disabled={!selectedDuration}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
