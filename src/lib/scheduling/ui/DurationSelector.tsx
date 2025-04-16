
import React from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

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
      
      <RadioGroup 
        value={selectedDuration?.toString() || ""} 
        onValueChange={(value) => onDurationChange(parseInt(value))}
      >
        <div className="space-y-3">
          {options.map((option) => (
            <div
              key={option.minutes}
              className={`
                flex items-center justify-between rounded-lg border p-4
                ${selectedDuration === option.minutes ? "border-usc-cardinal" : ""}
              `}
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value={option.minutes.toString()} id={`duration-${option.minutes}`} />
                <Label htmlFor={`duration-${option.minutes}`} className="cursor-pointer">
                  <div>
                    <span className="font-medium">{option.minutes} minutes</span>
                    <p className="text-sm text-muted-foreground">
                      {option.minutes >= 60 ? 
                        `${option.minutes / 60} ${option.minutes === 60 ? 'hour' : 'hours'}` : 
                        `${option.minutes} minutes`}
                    </p>
                  </div>
                </Label>
              </div>
              <div className="text-right font-semibold">
                ${option.cost}
              </div>
            </div>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
}
