
import React from 'react';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import { WeeklyAvailability } from "@/lib/scheduling/types/availability";
import { validateDurationAgainstAvailability } from "@/lib/scheduling/duration-validation";

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
  // New props for validation
  selectedStartTime?: string;
  selectedDate?: Date;
  tutorAvailability?: WeeklyAvailability;
}

export function DurationSelector({ 
  options, 
  selectedDuration, 
  onSelectDuration,
  hourlyRate,
  className,
  selectedStartTime,
  selectedDate,
  tutorAvailability
}: DurationSelectorProps) {
  // Calculate price based on hourly rate and duration
  const calculatePrice = (minutes: number): number => {
    return (hourlyRate / 60) * minutes;
  };

  // Check if a duration is valid
  const isDurationValid = (minutes: number): boolean => {
    if (!selectedStartTime || !selectedDate || !tutorAvailability) {
      return true; // If we don't have the data, don't disable
    }
    return validateDurationAgainstAvailability(
      selectedStartTime, 
      minutes, 
      selectedDate, 
      tutorAvailability
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      <h2 className="text-2xl font-bold">Select Session Duration</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
        <TooltipProvider>
          {options.map((option) => {
            const price = calculatePrice(option.minutes);
            const isValid = isDurationValid(option.minutes);
            
            const button = (
              <Button
                key={option.minutes}
                type="button"
                variant="outline"
                disabled={!isValid}
                className={cn(
                  "h-32 flex flex-col items-center justify-center p-6 border rounded-md relative",
                  selectedDuration === option.minutes 
                    ? "bg-red-50 border-usc-cardinal text-usc-cardinal" 
                    : isValid 
                      ? "bg-white hover:bg-gray-50"
                      : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                )}
                onClick={() => isValid && onSelectDuration(option.minutes)}
              >
                <Clock className={cn(
                  "h-5 w-5 mb-2",
                  selectedDuration === option.minutes ? "text-usc-cardinal" : 
                  isValid ? "text-muted-foreground" : "text-muted-foreground/50"
                )} />
                <span className="text-xl font-bold mb-2">
                  {option.display}
                </span>
                <span className="text-xl">
                  ${price.toFixed(2)}
                </span>
                
                {selectedDuration === option.minutes && isValid && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-usc-cardinal rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                )}
              </Button>
            );

            return !isValid ? (
              <Tooltip key={option.minutes}>
                <TooltipTrigger asChild>
                  {button}
                </TooltipTrigger>
                <TooltipContent>
                  <p>Session would extend beyond tutor's available hours</p>
                </TooltipContent>
              </Tooltip>
            ) : button;
          })}
        </TooltipProvider>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Rate: ${hourlyRate.toFixed(2)}/hour
      </p>
    </div>
  );
}
