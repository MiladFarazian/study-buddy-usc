
import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useScheduling } from '@/contexts/SchedulingContext';

const DURATION_OPTIONS = [30, 60, 90, 120];

export function SessionDurationSelector() {
  const { state, dispatch, calculatePrice, tutor } = useScheduling();
  const { selectedDuration } = state;
  
  const handleSelectDuration = (duration: number) => {
    dispatch({ type: 'SET_DURATION', payload: duration });
  };
  
  // Use the tutor's hourly rate from their profile
  const hourlyRate = tutor?.hourlyRate || 25; // Default to $25 if not set
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Select Session Duration</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DURATION_OPTIONS.map((minutes) => {
          const price = calculatePrice(minutes);
          
          return (
            <Button
              key={minutes}
              variant="outline"
              className={cn(
                "h-32 flex flex-col items-center justify-center p-6 rounded-md border",
                selectedDuration === minutes 
                  ? "bg-red-50 border-usc-cardinal text-usc-cardinal" 
                  : "bg-white hover:bg-gray-50"
              )}
              onClick={() => handleSelectDuration(minutes)}
            >
              <span className="text-xl font-bold mb-2">{minutes} minutes</span>
              <span className="text-lg text-muted-foreground">${price.toFixed(0)}</span>
            </Button>
          );
        })}
      </div>
      
      <div className="flex justify-between mt-8">
        <Button 
          variant="outline" 
          className="px-8"
          onClick={() => dispatch({ type: 'SET_STEP', payload: 0 })}
        >
          Back
        </Button>
        
        <Button 
          className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white px-8"
          onClick={() => {
            if (selectedDuration) {
              dispatch({ type: 'SET_STEP', payload: 2 });
            }
          }}
          disabled={!selectedDuration}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
