
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TimeSelector } from "@/lib/scheduling/ui/TimeSelector";

interface TimeSlot {
  start: string;
  available: boolean;
}

interface TimeStepProps {
  timeSlots: TimeSlot[];
  selectedTime: string | null;
  onTimeChange: (time: string) => void;
  onContinue: () => void;
}

export function TimeStep({ 
  timeSlots, 
  selectedTime, 
  onTimeChange,
  onContinue 
}: TimeStepProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <TimeSelector 
            timeSlots={timeSlots}
            selectedTime={selectedTime}
            onTimeChange={onTimeChange}
          />
          
          <div className="flex justify-end">
            <Button 
              className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
              disabled={!selectedTime}
              onClick={onContinue}
            >
              Continue
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
