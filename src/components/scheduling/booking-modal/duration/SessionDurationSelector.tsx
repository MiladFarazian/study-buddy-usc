
import { useState } from "react";
import { Clock, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookingSlot } from "@/lib/scheduling/types";
import { WeeklyAvailability } from "@/lib/scheduling/types/availability";
import { validateDurationAgainstAvailability } from "@/lib/scheduling/duration-validation";

interface SessionDurationSelectorProps {
  selectedDuration: number | null;
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
  tutorAvailability?: WeeklyAvailability | null;
  selectedDate?: Date;
  selectedSlot?: BookingSlot | null;
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
  tutorAvailability,
  selectedDate,
  selectedSlot
}: SessionDurationSelectorProps) {
  // Add debugging logs for Phase 1 & 2 testing
  console.log("🔍 SessionDurationSelector - TutorAvailability:", tutorAvailability);
  console.log("🔍 SessionDurationSelector - Selected date:", selectedDate);
  console.log("🔍 SessionDurationSelector - Selected slot:", selectedSlot);
  
  // Session duration options in minutes
  const durationOptions = [
    { value: 30, label: "30 min" },
    { value: 60, label: "60 min" },
    { value: 90, label: "90 min" },
    { value: 120, label: "120 min" }
  ];

  // Validation logic for Phase 2 testing
  const isDurationValid = (durationMinutes: number) => {
    if (!tutorAvailability || !selectedDate || !selectedSlot?.start) {
      console.log(`🔍 Duration ${durationMinutes}min: Missing validation data`);
      return true; // If data is missing, don't disable options
    }
    
    const isValid = validateDurationAgainstAvailability(
      selectedSlot.start,
      durationMinutes,
      selectedDate,
      tutorAvailability
    );
    
    console.log(`🔍 Duration ${durationMinutes}min: ${isValid ? "✅ Valid" : "❌ Invalid"}`);
    return isValid;
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
        {durationOptions.map((option) => {
          const isValid = isDurationValid(option.value);
          return (
            <Button
              key={option.value}
              type="button"
              onClick={() => onDurationChange(option.value)}
              disabled={!isValid}
              className={cn(
                "h-auto py-4 flex flex-col items-center justify-center",
                selectedDuration === option.value
                  ? "bg-usc-cardinal text-white hover:bg-usc-cardinal-dark"
                  : isValid
                  ? "bg-white text-gray-800 border hover:bg-gray-100"
                  : "bg-gray-200 text-gray-400 border cursor-not-allowed"
              )}
              variant={selectedDuration === option.value ? "default" : "outline"}
              title={!isValid ? "Duration extends beyond tutor's available hours" : undefined}
            >
              <span className="text-lg font-medium">{option.label}</span>
            </Button>
          );
        })}
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
