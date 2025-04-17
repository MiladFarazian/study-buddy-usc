
import React from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DurationOption {
  minutes: number;
  cost: number;
}

export interface DurationSelectorProps {
  options: DurationOption[];
  selectedDuration: number | null;
  onDurationChange: (minutes: number) => void;
  hourlyRate?: number;
}

export function DurationSelector({
  options,
  selectedDuration,
  onDurationChange,
  hourlyRate = 0
}: DurationSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Select Session Duration</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
        {options.map((option) => {
          const isSelected = selectedDuration === option.minutes;
          const durationText = option.minutes >= 60 
            ? `${option.minutes / 60} ${option.minutes === 60 ? 'hour' : 'hours'}` 
            : `${option.minutes} minutes`;
          
          return (
            <Button
              key={option.minutes}
              type="button"
              variant="outline"
              className={cn(
                "h-32 flex flex-col items-center justify-center p-6 border rounded-md relative",
                isSelected ? "bg-red-50 border-usc-cardinal text-usc-cardinal" : "bg-white hover:bg-gray-50"
              )}
              onClick={() => onDurationChange(option.minutes)}
            >
              <Clock className={cn(
                "h-5 w-5 mb-2",
                isSelected ? "text-usc-cardinal" : "text-muted-foreground"
              )} />
              <span className="text-xl font-bold mb-2">
                {durationText}
              </span>
              <span className="text-xl">
                ${option.cost.toFixed(2)}
              </span>
              
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-usc-cardinal rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
              )}
            </Button>
          );
        })}
      </div>
      
      <p className="text-sm text-muted-foreground">
        Rate: ${hourlyRate.toFixed(2)}/hour
      </p>
    </div>
  );
}
