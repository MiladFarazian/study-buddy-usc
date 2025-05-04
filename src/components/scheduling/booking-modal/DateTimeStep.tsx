
import React from 'react';
import { DateSelector } from "./date-selector/DateSelector";
import { TimeSlotList } from "./time-slot/TimeSlotList";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { BookingSlot } from "@/lib/scheduling/types";

interface DateTimeStepProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date) => void;
  availableSlots: BookingSlot[];
  selectedSlot: BookingSlot | null;
  onSelectSlot: (slot: BookingSlot) => void;
  onContinue: () => void;
  isLoading?: boolean;
}

export function DateTimeStep({
  selectedDate,
  onDateChange,
  availableSlots,
  selectedSlot,
  onSelectSlot,
  onContinue,
  isLoading = false
}: DateTimeStepProps) {
  return (
    <>
      <DateSelector 
        date={selectedDate}
        onDateChange={onDateChange}
        availableSlots={availableSlots}
        isLoading={isLoading}
      />
      
      {selectedDate && (
        <TimeSlotList
          slots={availableSlots}
          onSelectSlot={onSelectSlot}
          selectedSlot={selectedSlot}
          selectedDate={selectedDate}
        />
      )}
      
      <div className="flex justify-between mt-6 pt-4 border-t">
        <div></div>
        <Button 
          className="bg-usc-cardinal hover:bg-usc-cardinal-dark"
          onClick={onContinue}
          disabled={!selectedSlot}
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </>
  );
}
