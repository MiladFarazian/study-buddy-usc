
import React from 'react';
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SessionDurationSelectorProps {
  sessionTimeRange: { start: string; end: string };
  calculatedCost: number;
  sessionDuration: number;
  onDurationChange: (values: number) => void;
  onStartTimeChange: (time: string, hourlyRate?: number) => void;
  maxDuration: number;
  hourlyRate: number;
  availableStartTimes: string[];
  selectedStartTime: string | null;
  formatTimeForDisplay: (time: string) => string;
}

export const SessionDurationSelector = ({
  sessionTimeRange,
  calculatedCost,
  sessionDuration,
  onDurationChange,
  onStartTimeChange,
  maxDuration,
  hourlyRate,
  availableStartTimes,
  selectedStartTime,
  formatTimeForDisplay
}: SessionDurationSelectorProps) => {
  
  // Default duration options
  const durationOptions = [30, 60, 90, 120];
  
  // Filter options based on max available duration
  const availableDurations = durationOptions.filter(duration => duration <= maxDuration);
  
  // Format price display
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(calculatedCost);
  
  // Handler to call onStartTimeChange with hourlyRate
  const handleStartTimeChange = (time: string) => {
    onStartTimeChange(time, hourlyRate);
  };
  
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">Session Duration</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Choose how long you'd like your session to be
        </p>
        
        <div className="flex flex-wrap gap-4 mb-6">
          {availableDurations.map(duration => (
            <button
              key={duration}
              type="button"
              className={`
                px-4 py-2 rounded-md border text-sm font-medium
                ${sessionDuration === duration 
                  ? 'bg-usc-cardinal text-white border-usc-cardinal' 
                  : 'bg-white hover:bg-slate-50 border-gray-200'}
              `}
              onClick={() => onDurationChange(duration)}
            >
              {duration} min
            </button>
          ))}
        </div>
      </div>
      
      {availableStartTimes.length > 1 && (
        <div>
          <Label className="text-base font-medium">Start Time</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Choose when your session should start
          </p>
          
          <Select 
            value={selectedStartTime || undefined} 
            onValueChange={handleStartTimeChange}
          >
            <SelectTrigger className="w-full">
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
      
      <div className="rounded-md bg-slate-50 p-4 mt-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-slate-700">Session Summary</p>
            <p className="text-xs text-slate-500 mt-1">
              {formatTimeForDisplay(sessionTimeRange.start)} - {formatTimeForDisplay(sessionTimeRange.end)} 
              ({sessionDuration} min)
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-700">Total Price</p>
            <p className="text-lg font-bold text-usc-cardinal">{formattedPrice}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
