
import React from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatTimeDisplay } from "../time-utils";
import { Clock } from "lucide-react";

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface TimeSelectorProps {
  timeSlots: TimeSlot[];
  selectedTime: string | null;
  onTimeChange: (time: string) => void;
}

export function TimeSelector({
  timeSlots,
  selectedTime,
  onTimeChange,
}: TimeSelectorProps) {
  // Group time slots by hour to improve UI organization
  const groupTimeSlotsByHour = () => {
    const grouped: { [hour: string]: TimeSlot[] } = {};
    
    timeSlots.filter(slot => slot.available).forEach(slot => {
      const [hours] = slot.time.split(':');
      if (!grouped[hours]) {
        grouped[hours] = [];
      }
      grouped[hours].push(slot);
    });
    
    return grouped;
  };
  
  const groupedSlots = groupTimeSlotsByHour();
  const hasAvailableSlots = timeSlots.some(slot => slot.available);

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Select a Time</h3>
      
      {!hasAvailableSlots ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/30 rounded-md">
          <Clock className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No available time slots for this date.</p>
        </div>
      ) : (
        <ScrollArea className="h-64">
          <div className="space-y-4">
            {Object.entries(groupedSlots).map(([hour, slots]) => (
              <div key={hour} className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  {formatTimeDisplay(`${hour}:00`).split(':')[0]} {parseInt(hour) >= 12 ? 'PM' : 'AM'}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {slots.map((slot, index) => (
                    <Button
                      key={index}
                      variant={selectedTime === slot.time ? "default" : "outline"}
                      className={`h-12 ${selectedTime === slot.time ? "bg-usc-cardinal hover:bg-usc-cardinal-dark" : ""}`}
                      onClick={() => onTimeChange(slot.time)}
                    >
                      {formatTimeDisplay(slot.time)}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
