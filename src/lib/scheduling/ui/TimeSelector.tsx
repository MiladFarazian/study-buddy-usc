
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, parse } from 'date-fns';
import { Clock } from "lucide-react";

export interface TimeSlot {
  time: string; // Format: "HH:mm" (24-hour)
  available: boolean;
}

interface TimeSelectorProps {
  availableTimeSlots: TimeSlot[];
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
}

export function TimeSelector({ availableTimeSlots, selectedTime, onSelectTime }: TimeSelectorProps) {
  // Function to format time from 24-hour to 12-hour format
  const formatTimeDisplay = (time24: string): string => {
    const timeObj = parse(time24, 'HH:mm', new Date());
    return format(timeObj, 'h:mm a');
  };

  const morningSlots = availableTimeSlots.filter(
    slot => parseInt(slot.time.split(':')[0]) < 12
  );
  
  const afternoonSlots = availableTimeSlots.filter(
    slot => parseInt(slot.time.split(':')[0]) >= 12
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Select a Time</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          {morningSlots.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {morningSlots.map((slot) => (
                <Button
                  key={slot.time}
                  variant="outline"
                  className={cn(
                    "h-16 w-full justify-center",
                    selectedTime === slot.time && "bg-usc-cardinal text-white border-usc-cardinal",
                    !slot.available && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={!slot.available}
                  onClick={() => onSelectTime(slot.time)}
                >
                  {formatTimeDisplay(slot.time)}
                </Button>
              ))}
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          {afternoonSlots.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {afternoonSlots.map((slot) => (
                <Button
                  key={slot.time}
                  variant="outline"
                  className={cn(
                    "h-16 w-full justify-center",
                    selectedTime === slot.time && "bg-usc-cardinal text-white border-usc-cardinal",
                    !slot.available && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={!slot.available}
                  onClick={() => onSelectTime(slot.time)}
                >
                  {formatTimeDisplay(slot.time)}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {availableTimeSlots.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8 border rounded-md bg-muted/30">
          <Clock className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground text-center">
            No available time slots for this date. Please select another date.
          </p>
        </div>
      )}
    </div>
  );
}
