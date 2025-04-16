
import React from 'react';
import { Button } from "@/components/ui/button";
import { Clock, DollarSign } from "lucide-react";

export interface DurationOption {
  minutes: number;
  cost: number;
}

interface DurationSelectorProps {
  options: DurationOption[];
  selectedDuration: number | null;
  onDurationChange: (minutes: number) => void;
  hourlyRate: number;
}

export function DurationSelector({ 
  options, 
  selectedDuration, 
  onDurationChange,
  hourlyRate
}: DurationSelectorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Select Session Duration</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {options.map((option) => (
          <Button
            key={option.minutes}
            variant="outline"
            className={`h-auto py-6 flex flex-col items-center justify-center ${
              selectedDuration === option.minutes ? 'border-2 border-usc-cardinal ring-2 ring-usc-cardinal/30' : ''
            }`}
            onClick={() => onDurationChange(option.minutes)}
          >
            <Clock className="h-5 w-5 mb-1" />
            <span className="font-medium text-lg">
              {option.minutes < 60 
                ? `${option.minutes} min` 
                : option.minutes === 60 
                  ? '1 hour' 
                  : `${option.minutes / 60} hours`}
            </span>
            <div className="flex items-center text-sm mt-2 text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5 mr-0.5" />
              <span>${option.cost}</span>
            </div>
          </Button>
        ))}
      </div>
      
      <p className="text-sm text-muted-foreground text-center">
        Rate: ${hourlyRate.toFixed(2)}/hour
      </p>
    </div>
  );
}

export default DurationSelector;
