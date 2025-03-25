
import React from 'react';
import { format } from 'date-fns';
import { BookingSlot } from "@/lib/scheduling";
import { CalendarDays, Clock } from "lucide-react";

interface SelectedTimeDisplayProps {
  selectedSlot: BookingSlot | null;
}

export const SelectedTimeDisplay: React.FC<SelectedTimeDisplayProps> = ({ selectedSlot }) => {
  if (!selectedSlot) return null;
  
  return (
    <div className="mt-4 p-3 border rounded-md bg-muted/30">
      <h4 className="font-medium">Selected Time Slot:</h4>
      <div className="flex items-center mt-2">
        <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
        <span>{format(selectedSlot.day, 'EEEE, MMMM d, yyyy')}</span>
      </div>
      <div className="flex items-center mt-1">
        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
        <span>{selectedSlot.start} - {selectedSlot.end}</span>
      </div>
    </div>
  );
};
