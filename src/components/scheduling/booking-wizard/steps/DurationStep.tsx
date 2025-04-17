
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { DurationSelector } from "@/lib/scheduling/ui/DurationSelector";

interface DurationOption {
  minutes: number;
  cost: number;
}

interface DurationStepProps {
  options: DurationOption[];
  selectedDuration: number | null;
  onDurationChange: (duration: number) => void;
  hourlyRate: number;
}

export function DurationStep({ 
  options, 
  selectedDuration, 
  onDurationChange,
  hourlyRate 
}: DurationStepProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <DurationSelector
          options={options}
          selectedDuration={selectedDuration}
          onDurationChange={onDurationChange}
          hourlyRate={hourlyRate}
        />
      </CardContent>
    </Card>
  );
}
