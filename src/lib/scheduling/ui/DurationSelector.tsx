
import React from 'react';
import { Button } from "@/components/ui/button";

export interface DurationOption {
  minutes: number;
  cost: number;
}

export interface DurationSelectorProps {
  selectedDuration: number | null;
  onDurationChange: (minutes: number) => void;
  options?: DurationOption[];
  disabled?: boolean;
  hourlyRate?: number;
  onSelectDuration?: (minutes: number) => void; // Add for compatibility
}

export function DurationSelector({
  selectedDuration,
  onDurationChange,
  options = [
    { minutes: 30, cost: 25 },
    { minutes: 60, cost: 50 },
    { minutes: 90, cost: 75 }
  ],
  disabled = false,
  hourlyRate,
  onSelectDuration, // For compatibility with NewBookingWizard
}: DurationSelectorProps) {
  // Handle duration selection with both callback styles
  const handleSelectDuration = (minutes: number) => {
    if (onSelectDuration) {
      onSelectDuration(minutes);
    }
    onDurationChange(minutes);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Select Session Duration</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {options.map((option) => (
          <Button
            key={option.minutes}
            variant={selectedDuration === option.minutes ? "default" : "outline"}
            className={`p-4 h-auto flex flex-col items-center justify-center ${
              selectedDuration === option.minutes ? "bg-usc-cardinal text-white" : ""
            }`}
            disabled={disabled}
            onClick={() => handleSelectDuration(option.minutes)}
          >
            <span className="text-lg font-medium">{option.minutes} min</span>
            <span className="mt-1">${option.cost.toFixed(2)}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
