
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [durationMethod, setDurationMethod] = useState<'slider' | 'preset'>('preset');
  
  // Available duration presets (up to the max allowed duration)
  const durationPresets = [
    { value: 30, label: '30 min' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' }
  ].filter(preset => preset.value <= maxDuration);
  
  // Format cost as currency
  const formattedCost = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(calculatedCost);
  
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
          <RadioGroup
            className="grid grid-cols-2 sm:grid-cols-4 gap-2"
            defaultValue={sessionDuration.toString()}
            onValueChange={(value) => onDurationChange(parseInt(value))}
          >
            {durationPresets.map(preset => (
              <div key={preset.value} className="flex items-center space-x-2">
                <RadioGroupItem 
                  value={preset.value.toString()} 
                  id={`duration-${preset.value}`}
                  checked={sessionDuration === preset.value}
                />
                <Label 
                  htmlFor={`duration-${preset.value}`}
                  className={sessionDuration === preset.value ? "font-medium" : ""}
                >
                  {preset.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
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
