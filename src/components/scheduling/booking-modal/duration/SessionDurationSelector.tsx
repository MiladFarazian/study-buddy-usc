
import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { WeeklyAvailability } from "@/lib/scheduling/types/availability";
import { validateDurationAgainstAvailability } from "@/lib/scheduling/duration-validation";
import { getTutorAvailability } from "@/lib/scheduling/availability-manager";

interface SessionDurationSelectorProps {
  selectedDuration: number;
  onDurationChange: (duration: number) => void;
  sessionTimeRange?: { start: string; end: string };
  calculatedCost?: number;
  sessionDuration?: number;
  onStartTimeChange?: (time: string) => void;
  maxDuration?: number;
  hourlyRate?: number;
  availableStartTimes?: string[];
  selectedStartTime?: string;
  formatTimeForDisplay?: (time: string) => string;
  onBack?: () => void;
  onContinue?: () => void;
  // New props for validation
  selectedDate?: Date;
  tutorId?: string;
}

export function SessionDurationSelector({
  selectedDuration,
  onDurationChange,
  sessionTimeRange,
  calculatedCost,
  onStartTimeChange,
  availableStartTimes = [],
  selectedStartTime,
  formatTimeForDisplay = (time) => time,
  onBack,
  onContinue,
  selectedDate,
  tutorId
}: SessionDurationSelectorProps) {
  const [tutorAvailability, setTutorAvailability] = useState<WeeklyAvailability | null>(null);

  // Fetch tutor availability when component mounts
  useEffect(() => {
    if (tutorId) {
      getTutorAvailability(tutorId).then(availability => {
        setTutorAvailability(availability);
      });
    }
  }, [tutorId]);

  // Session duration options in minutes
  const durationOptions = [
    { value: 30, label: "30 min" },
    { value: 60, label: "60 min" },
    { value: 90, label: "90 min" },
    { value: 120, label: "120 min" }
  ];

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
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold">Session Duration</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Choose how long you'd like your session to be
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <TooltipProvider>
          {durationOptions.map((option) => {
            const isValid = isDurationValid(option.value);
            
            const button = (
              <Button
                key={option.value}
                type="button"
                disabled={!isValid}
                onClick={() => isValid && onDurationChange(option.value)}
                className={cn(
                  "h-auto py-4 flex flex-col items-center justify-center",
                  selectedDuration === option.value && isValid
                    ? "bg-usc-cardinal text-white hover:bg-usc-cardinal-dark"
                    : isValid
                      ? "bg-white text-gray-800 border hover:bg-gray-100"
                      : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                )}
                variant={selectedDuration === option.value && isValid ? "default" : "outline"}
              >
                <span className="text-lg font-medium">{option.label}</span>
              </Button>
            );

            return !isValid ? (
              <Tooltip key={option.value}>
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

      {onStartTimeChange && availableStartTimes.length > 0 && (
        <div className="space-y-2 mt-6">
          <h3 className="text-lg font-medium">Start Time</h3>
          <p className="text-sm text-muted-foreground">
            Choose when your session should start
          </p>
          <Select
            value={selectedStartTime}
            onValueChange={onStartTimeChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select start time" />
            </SelectTrigger>
            <SelectContent>
              {availableStartTimes.map((time) => (
                <SelectItem key={time} value={time}>
                  {formatTimeForDisplay(time)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {sessionTimeRange && calculatedCost !== undefined && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-medium">Session Summary</h3>
          <div className="flex justify-between items-center p-4 bg-muted/30 rounded-md">
            <div>
              <p className="text-sm text-muted-foreground">
                {sessionTimeRange.start} - {sessionTimeRange.end}
                {selectedDuration && `(${selectedDuration} min)`}
              </p>
            </div>
            <div>
              <p className="text-xl font-bold text-usc-cardinal">
                ${calculatedCost.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add back the navigation buttons */}
      {(onBack || onContinue) && (
        <div className="flex justify-between pt-4 mt-8">
          {onBack && (
            <Button 
              variant="outline" 
              onClick={onBack}
              className="px-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          
          {onContinue && (
            <Button 
              className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white px-6"
              onClick={onContinue}
              disabled={!selectedDuration}
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
