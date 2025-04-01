
import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface DurationOption {
  minutes: number;
  display: string;
}

interface DurationSelectorProps {
  options: DurationOption[];
  selectedDuration: number | null;
  onSelectDuration: (minutes: number) => void;
  hourlyRate: number;
  className?: string;
}

export function DurationSelector({ 
  options, 
  selectedDuration, 
  onSelectDuration,
  hourlyRate,
  className
}: DurationSelectorProps) {
  // Calculate price based on hourly rate and duration
  const calculatePrice = (minutes: number): number => {
    return (hourlyRate / 60) * minutes;
  };

  // Ensure options is an array
  const safeOptions = Array.isArray(options) ? options : [];

  return (
    <div className={cn("space-y-4", className)}>
      <h2 className="text-2xl font-bold">Select Session Duration</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
        {safeOptions.map((option) => {
          const price = calculatePrice(option.minutes);
          
          return (
            <Button
              key={option.minutes}
              type="button"
              variant="outline"
              className={cn(
                "h-32 flex flex-col items-center justify-center p-6 border rounded-md relative",
                selectedDuration === option.minutes 
                  ? "bg-red-50 border-usc-cardinal text-usc-cardinal" 
                  : "bg-white hover:bg-gray-50"
              )}
              onClick={() => onSelectDuration(option.minutes)}
            >
              <Clock className={cn(
                "h-5 w-5 mb-2",
                selectedDuration === option.minutes ? "text-usc-cardinal" : "text-muted-foreground"
              )} />
              <span className="text-xl font-bold mb-2">
                {option.display}
              </span>
              <span className="text-xl">
                ${price.toFixed(2)}
              </span>
              
              {selectedDuration === option.minutes && (
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
