
import React from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Clock, DollarSign } from "lucide-react";

export interface DurationOption {
  minutes: number;
  cost: number;
  label?: string;
}

export interface DurationSelectorProps {
  options: DurationOption[];
  selectedDuration: number | null;
  onDurationSelect: (minutes: number) => void;
  disabled?: boolean;
}

export function DurationSelector({
  options,
  selectedDuration,
  onDurationSelect,
  disabled = false
}: DurationSelectorProps) {
  // Format duration for display (e.g., 60 -> "1 hour", 90 -> "1 hour 30 minutes")
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes 
      ? `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minutes` 
      : `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  return (
    <RadioGroup
      value={selectedDuration?.toString()}
      onValueChange={(value) => onDurationSelect(parseInt(value))}
      disabled={disabled}
      className="space-y-3"
    >
      {options.map((option) => (
        <div
          key={option.minutes}
          className={`flex items-center space-x-2 rounded-md border p-4 ${
            selectedDuration === option.minutes ? 'border-usc-cardinal bg-red-50' : ''
          }`}
        >
          <RadioGroupItem 
            value={option.minutes.toString()} 
            id={`duration-${option.minutes}`}
            className="border-gray-400"
          />
          <Label 
            htmlFor={`duration-${option.minutes}`}
            className="flex flex-1 justify-between items-center cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{option.label || formatDuration(option.minutes)}</span>
            </div>
            <div className="flex items-center text-usc-cardinal font-medium">
              <DollarSign className="h-4 w-4" />
              <span>{option.cost}</span>
            </div>
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
