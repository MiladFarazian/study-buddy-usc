
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

export interface DurationOption {
  minutes: number;
  cost: number;
}

interface DurationSelectorProps {
  options: DurationOption[];
  selectedDuration: number | null;
  onSelectDuration: (minutes: number) => void;
  hourlyRate: number;
}

export const DurationSelector: React.FC<DurationSelectorProps> = ({
  options,
  selectedDuration,
  onSelectDuration,
  hourlyRate
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Session Duration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {options.map((option) => (
              <button
                key={option.minutes}
                className={`
                  p-4 rounded-md border text-center transition-colors flex flex-col items-center justify-center
                  ${selectedDuration === option.minutes
                    ? 'bg-usc-cardinal text-white border-usc-cardinal'
                    : 'bg-background hover:bg-muted/50 border-input'
                  }
                `}
                onClick={() => onSelectDuration(option.minutes)}
              >
                <span className="text-lg font-medium">{option.minutes} min</span>
                <span className={selectedDuration === option.minutes ? 'text-white/80' : 'text-muted-foreground'}>
                  ${option.cost.toFixed(2)}
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Custom Duration</div>
            <Slider
              defaultValue={[selectedDuration || 60]}
              min={30}
              max={180}
              step={15}
              onValueChange={(values) => onSelectDuration(values[0])}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>30 min</span>
              <span>3 hours</span>
            </div>
          </div>

          {selectedDuration && (
            <div className="border rounded-md p-4 bg-muted/50">
              <div className="flex justify-between items-center">
                <div className="font-medium">Selected Duration:</div>
                <div>{selectedDuration} minutes</div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="font-medium">Cost:</div>
                <div>${((selectedDuration / 60) * hourlyRate).toFixed(2)}</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
