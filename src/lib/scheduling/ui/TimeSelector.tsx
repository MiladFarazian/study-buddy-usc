
import React from 'react';
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { formatTimeDisplay } from '../time-utils';

export interface TimeSlot {
  time: string;
  available: boolean;
}

interface TimeSelectorProps {
  timeSlots: TimeSlot[];
  selectedTime: string | null;
  onTimeChange: (time: string) => void;
}

export function TimeSelector({ timeSlots, selectedTime, onTimeChange }: TimeSelectorProps) {
  if (timeSlots.length === 0) {
    return (
      <div className="text-center p-4">
        <Clock className="mx-auto h-10 w-10 text-muted-foreground opacity-50 mb-2" />
        <p className="text-muted-foreground">No available times for this date.</p>
        <p className="text-sm text-muted-foreground">Please select another date.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Select a Time</h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {timeSlots.map((slot) => (
          <Button
            key={slot.time}
            variant={selectedTime === slot.time ? "default" : "outline"}
            className={`h-auto py-3 ${selectedTime === slot.time ? 'bg-usc-cardinal hover:bg-usc-cardinal-dark text-white' : ''}`}
            onClick={() => onTimeChange(slot.time)}
            disabled={!slot.available}
          >
            {formatTimeDisplay(slot.time)}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default TimeSelector;
