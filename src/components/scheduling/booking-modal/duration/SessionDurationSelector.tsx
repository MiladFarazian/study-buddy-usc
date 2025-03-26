
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";

interface SessionDurationSelectorProps {
  sessionTimeRange: string;
  calculatedCost: number | null;
  sessionDuration: number;
  onDurationChange: (value: number[]) => void;
  onStartTimeChange: (startTime: string) => void;
  maxDuration: number;
  hourlyRate: number;
  availableStartTimes: string[];
  selectedStartTime: string;
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
  return (
    <div className="space-y-3 p-4 border rounded-md bg-muted/30">
      <Label>3. Choose Session Duration</Label>
      
      <div className="py-2">
        <div className="mb-4">
          <Label className="text-sm mb-1">Start Time</Label>
          <Select value={selectedStartTime} onValueChange={onStartTimeChange}>
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
        
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">{sessionTimeRange}</span>
          {calculatedCost !== null && (
            <span className="font-bold text-usc-cardinal">${calculatedCost.toFixed(2)}</span>
          )}
        </div>
        
        <Slider
          defaultValue={[sessionDuration]}
          min={15}
          max={maxDuration}
          step={15}
          value={[sessionDuration]}
          onValueChange={onDurationChange}
          className="my-4"
        />
        
        <div className="flex justify-between text-sm text-muted-foreground mt-1">
          <span>15 min</span>
          <span>{maxDuration / 60} hours</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center text-sm">
        <span>Duration: {(sessionDuration / 60).toFixed(1)} hours</span>
        <span>Rate: ${hourlyRate.toFixed(2)}/hour</span>
      </div>
    </div>
  );
};
