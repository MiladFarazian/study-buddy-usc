
import { useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BookingSlot } from "@/lib/scheduling/types";
import { convertTimeToMinutes } from "@/lib/scheduling/time-utils";

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
  selectedSlot?: BookingSlot;
  onBack?: () => void;
  onContinue?: () => void;
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
  selectedSlot,
  onBack,
  onContinue
}: SessionDurationSelectorProps) {
  // Helper function to check if a duration is valid for the selected slot
  const isValidDuration = (durationMinutes: number): boolean => {
    if (!selectedSlot?.start || !selectedSlot?.availabilityEnd) return true;
    
    const startMinutes = convertTimeToMinutes(selectedSlot.start);
    const endMinutes = convertTimeToMinutes(selectedSlot.availabilityEnd);
    const sessionEndMinutes = startMinutes + durationMinutes + 30; // 30-minute buffer
    
    return sessionEndMinutes <= endMinutes;
  };

  // Session duration options in minutes - filter based on availability
  const baseDurationOptions = [
    { value: 30, label: "30 min" },
    { value: 60, label: "60 min" },
    { value: 90, label: "90 min" },
    { value: 120, label: "120 min" }
  ];

  const durationOptions = baseDurationOptions.map(option => ({
    ...option,
    disabled: !isValidDuration(option.value),
    reason: !isValidDuration(option.value) ? "Extends beyond tutor availability" : undefined
  }));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold">Session Duration</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Choose how long you'd like your session to be
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {durationOptions.map((option) => (
          <Button
            key={option.value}
            type="button"
            onClick={() => onDurationChange(option.value)}
            disabled={option.disabled}
            className={cn(
              "h-auto py-4 flex flex-col items-center justify-center relative",
              selectedDuration === option.value
                ? "bg-usc-cardinal text-white hover:bg-usc-cardinal-dark"
                : option.disabled
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-white text-gray-800 border hover:bg-gray-100"
            )}
            variant={selectedDuration === option.value ? "default" : "outline"}
            title={option.reason}
          >
            <span className="text-lg font-medium">{option.label}</span>
            {option.disabled && (
              <span className="text-xs text-gray-400 mt-1">Not available</span>
            )}
          </Button>
        ))}
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
