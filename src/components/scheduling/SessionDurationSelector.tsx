
import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
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
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Select Session Duration</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {DURATION_OPTIONS.map((minutes) => {
          const price = calculatePrice(minutes);
          
          return (
            <Button
              key={minutes}
              variant="outline"
              className={cn(
                "h-24 flex flex-col items-center justify-center p-4",
                selectedDuration === minutes 
                  ? "bg-red-50 border-usc-cardinal text-usc-cardinal" 
                  : "bg-white hover:bg-gray-50"
              )}
              onClick={() => handleSelectDuration(minutes)}
            >
              <span className="text-lg font-medium mb-1">{minutes} minutes</span>
              <span className="text-muted-foreground">${price.toFixed(2)}</span>
            </Button>
          );
        })}
      </div>
      
      <p className="text-sm text-muted-foreground mt-2">
        Rate: ${hourlyRate}/hour
      </p>
    </div>
  );
}
