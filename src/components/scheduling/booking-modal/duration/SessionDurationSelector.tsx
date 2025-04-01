
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Clock, DollarSign } from "lucide-react";

interface SessionDurationSelectorProps {
  sessionTimeRange: string;
  calculatedCost: number;
  sessionDuration: number;
  maxDuration: number;
  hourlyRate: number;
  onDurationChange: (duration: number) => void;
  onStartTimeChange: (time: string) => void;
  availableStartTimes: string[];
  selectedStartTime: string | null;
  formatTimeForDisplay: (time: string) => string;
}

export const SessionDurationSelector = ({
  sessionTimeRange,
  calculatedCost,
  sessionDuration,
  maxDuration,
  hourlyRate,
  onDurationChange,
  onStartTimeChange,
  availableStartTimes,
  selectedStartTime,
  formatTimeForDisplay
}: SessionDurationSelectorProps) => {
  // Generate available duration options (in 30 min increments up to max duration)
  const durationOptions = [];
  for (let duration = 30; duration <= maxDuration; duration += 30) {
    if (duration <= 120) { // Only show up to 2 hours as common options
      durationOptions.push({
        value: duration,
        label: duration === 60 ? '1 hour' : 
               duration === 120 ? '2 hours' : 
               `${duration} min`
      });
    }
  }
  
  // Calculate cost based on hourly rate and duration in hours
  const durationInHours = sessionDuration / 60;
  const totalCost = hourlyRate * durationInHours;
  
  // Format cost as currency
  const formattedCost = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(totalCost);

  // When component loads, ensure it's showing the current session duration
  useEffect(() => {
    // This component is reactive to prop changes from parent
  }, [sessionDuration]);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Session Details</h3>
      </div>
      
      <div className="p-4 rounded-md border bg-muted/30">
        <div className="flex items-center mb-3">
          <Clock className="h-4 w-4 text-muted-foreground mr-2" />
          <span className="text-sm text-muted-foreground">Current selection:</span>
          <span className="ml-2 font-medium">{sessionTimeRange}</span>
        </div>
        
        {availableStartTimes.length > 1 && (
          <div className="mb-4">
            <Label htmlFor="start-time" className="mb-2 block">Start Time</Label>
            <Select
              value={selectedStartTime || undefined}
              onValueChange={onStartTimeChange}
            >
              <SelectTrigger id="start-time" className="w-full">
                <SelectValue placeholder="Select a start time" />
              </SelectTrigger>
              <SelectContent>
                {availableStartTimes.map(time => (
                  <SelectItem key={time} value={time}>
                    {formatTimeForDisplay(time)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="mb-4">
          <Label className="mb-2 block">Session Duration</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {durationOptions.map(option => (
              <Button
                key={option.value}
                type="button"
                variant={sessionDuration === option.value ? "default" : "outline"} 
                className={sessionDuration === option.value ? "bg-usc-cardinal hover:bg-usc-cardinal-dark" : ""}
                onClick={() => onDurationChange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 text-muted-foreground mr-1" />
            <span className="text-sm text-muted-foreground">Total cost:</span>
          </div>
          <span className="font-bold text-lg">{formattedCost}</span>
        </div>
      </div>
    </div>
  );
};
