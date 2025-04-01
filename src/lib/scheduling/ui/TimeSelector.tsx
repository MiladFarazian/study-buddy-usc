
import React from "react";
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

  return (
    <div className="space-y-2">
      {availableTimeSlots.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border rounded-md bg-gray-50">
          <Clock className="h-6 w-6 text-muted-foreground mb-2" />
          <p className="text-gray-500 text-center">
            No available time slots for this date. Please select another date.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {availableTimeSlots.map((slot) => (
            <Button
              key={slot.time}
              variant="outline"
              className={cn(
                "h-14 w-full justify-center text-base",
                selectedTime === slot.time 
                  ? "bg-usc-cardinal text-white border-usc-cardinal" 
                  : "bg-white",
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
  );
}
