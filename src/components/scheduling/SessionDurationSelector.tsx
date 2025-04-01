
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useScheduling } from '@/contexts/SchedulingContext';
import { CheckCircle2 } from 'lucide-react';

export const SessionDurationSelector = () => {
  const { state, dispatch, calculatePrice } = useScheduling();
  const { sessionDuration } = state;
  
  const durationOptions = [
    { minutes: 30, label: '30 minutes' },
    { minutes: 60, label: '1 hour' },
    { minutes: 90, label: '1.5 hours' },
    { minutes: 120, label: '2 hours' }
  ];
  
  const handleSelectDuration = (minutes: number) => {
    dispatch({ type: 'SET_DURATION', payload: minutes });
    
    // Calculate and set the cost
    const cost = calculatePrice(minutes);
    dispatch({ type: 'SET_COST', payload: cost });
  };
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Session Duration</h2>
      <p className="text-muted-foreground">
        Select how long you want your tutoring session to be
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        {durationOptions.map((option) => {
          const isSelected = sessionDuration === option.minutes;
          const cost = calculatePrice(option.minutes);
          
          return (
            <Card 
              key={option.minutes}
              className={`cursor-pointer transition-all border-2 ${
                isSelected 
                  ? 'border-usc-cardinal bg-red-50' 
                  : 'hover:border-usc-cardinal/50'
              }`}
              onClick={() => handleSelectDuration(option.minutes)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{option.label}</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      ${cost.toFixed(2)}
                    </p>
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
    </div>
  );
};
