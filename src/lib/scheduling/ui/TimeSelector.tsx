
import React from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock } from "lucide-react";

export interface TimeSlot {
  time: string;
  available: boolean;
  label?: string;
}

export interface TimeSelectorProps {
  timeSlots: TimeSlot[];
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  disabled?: boolean;
  maxHeight?: string;
}

export function TimeSelector({
  timeSlots,
  selectedTime,
  onTimeSelect,
  disabled = false,
  maxHeight = "300px"
}: TimeSelectorProps) {
  if (timeSlots.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-center text-muted-foreground">
        <div>
          <Clock className="mx-auto h-8 w-8 mb-2" />
          <p>No available times</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className={`pr-3 max-h-[${maxHeight}]`}>
      <div className="space-y-2">
        {timeSlots.map((slot, index) => (
          <TimeSlotButton
            key={`${slot.time}-${index}`}
            slot={slot}
            selectedTime={selectedTime}
            onTimeSelect={onTimeSelect}
            disabled={disabled || !slot.available}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

function TimeSlotButton({
  slot,
  selectedTime,
  onTimeSelect,
  disabled
}: {
  slot: TimeSlot;
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  disabled: boolean;
}) {
  const isSelected = selectedTime === slot.time;
  
  // Format time display (e.g., "14:30" -> "2:30 PM")
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <Button
      type="button"
      variant={isSelected ? "default" : "outline"}
      className={`w-full justify-start px-3 py-5 ${isSelected ? 'bg-usc-cardinal text-white' : ''} ${!slot.available ? 'opacity-50' : ''}`}
      onClick={() => onTimeSelect(slot.time)}
      disabled={disabled || !slot.available}
    >
      <div className="flex items-center">
        <Clock className="mr-2 h-4 w-4" />
        <span>{slot.label || formatTime(slot.time)}</span>
      </div>
    </Button>
  );
}
