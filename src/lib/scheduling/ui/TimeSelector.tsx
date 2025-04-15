
import React from 'react';
import { Button } from "@/components/ui/button";
import { formatTimeDisplay } from "../time-utils";

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface TimeSelectorProps {
  selectedTime: string | null;
  onTimeChange: (time: string) => void;
  timeSlots?: TimeSlot[];
  disabled?: boolean;
  availableTimeSlots?: TimeSlot[]; // Add this for compatibility
  onSelectTime?: (time: string) => void; // Add this for compatibility
}

export function TimeSelector({
  selectedTime,
  onTimeChange,
  timeSlots = [],
  disabled = false,
  availableTimeSlots = [], // For compatibility with NewBookingWizard
  onSelectTime // For compatibility with NewBookingWizard
}: TimeSelectorProps) {
  // Use either timeSlots or availableTimeSlots based on which is provided
  const slots = availableTimeSlots.length > 0 ? availableTimeSlots : timeSlots;
  
  // Handle time selection with compatibility for both callback styles
  const handleSelectTime = (time: string) => {
    if (onSelectTime) {
      onSelectTime(time);
    }
    onTimeChange(time);
  };

  if (slots.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">No available time slots for the selected date.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Select a Time</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {slots.map((slot, index) => (
          <Button
            key={index}
            variant={selectedTime === slot.time ? "default" : "outline"}
            className={`py-2 px-4 h-auto ${!slot.available ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={!slot.available || disabled}
            onClick={() => handleSelectTime(slot.time)}
          >
            {formatTimeDisplay(slot.time)}
          </Button>
        ))}
      </div>
    </div>
  );
}
