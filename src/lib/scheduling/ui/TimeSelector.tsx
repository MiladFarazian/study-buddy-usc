
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { getFormattedTime } from '@/lib/scheduling';

export interface TimeSlot {
  time: string;
  available: boolean;
}

interface TimeSelectorProps {
  availableTimeSlots: TimeSlot[];
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
}

export const TimeSelector: React.FC<TimeSelectorProps> = ({
  availableTimeSlots,
  selectedTime,
  onSelectTime
}) => {
  if (availableTimeSlots.length === 0) {
    return (
      <div className="p-4 text-center bg-muted/30 rounded-md">
        <p className="text-muted-foreground">No available time slots for the selected date.</p>
        <p className="text-sm text-muted-foreground mt-1">Please select another date.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Available Times</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {availableTimeSlots.map((slot, index) => {
          const isSelected = selectedTime === slot.time;
          
          return (
            <Card
              key={`${slot.time}-${index}`}
              className={`cursor-pointer transition-all border-2 ${
                isSelected 
                  ? 'border-usc-cardinal bg-red-50' 
                  : 'hover:border-usc-cardinal/50'
              }`}
              onClick={() => onSelectTime(slot.time)}
            >
              <CardContent className="p-3 flex justify-center items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{getFormattedTime(slot.time)}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
