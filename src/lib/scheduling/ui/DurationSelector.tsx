
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle2 } from "lucide-react";

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
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Session Duration</h3>
        <p className="text-muted-foreground">
          Select how long you want your tutoring session to be
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4">
        {options.map((option) => {
          const isSelected = selectedDuration === option.minutes;
          
          return (
            <Card 
              key={option.minutes}
              className={`cursor-pointer transition-all border-2 ${
                isSelected 
                  ? 'border-usc-cardinal bg-red-50' 
                  : 'hover:border-usc-cardinal/50'
              }`}
              onClick={() => onSelectDuration(option.minutes)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {option.minutes} minutes
                      </p>
                      <p className="text-muted-foreground text-sm">
                        ${option.cost.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="h-5 w-5 text-usc-cardinal" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <p className="text-sm text-muted-foreground">
        Rate: ${hourlyRate.toFixed(2)}/hour
      </p>
    </div>
  );
};
