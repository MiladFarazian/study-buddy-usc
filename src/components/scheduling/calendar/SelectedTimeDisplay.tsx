
import React from 'react';
import { format } from 'date-fns';
import { BookingSlot } from "@/lib/scheduling";
import { CalendarDays, Clock } from "lucide-react";

interface SelectedTimeDisplayProps {
  selectedSlot: BookingSlot | null;
}

export const SelectedTimeDisplay: React.FC<SelectedTimeDisplayProps> = ({ selectedSlot }) => {
  if (!selectedSlot) return null;
  
  // Calculate duration in minutes
  const calculateDuration = () => {
    if (!selectedSlot) return 0;
    
    const startHour = parseInt(selectedSlot.start.split(':')[0]);
    const startMinute = parseInt(selectedSlot.start.split(':')[1]);
    const endHour = parseInt(selectedSlot.end.split(':')[0]);
    const endMinute = parseInt(selectedSlot.end.split(':')[1]);
    
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    
    return endTotalMinutes - startTotalMinutes;
  };
  
  const durationMinutes = calculateDuration();
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  const durationText = hours > 0 
    ? `${hours} hour${hours > 1 ? 's' : ''}${minutes > 0 ? ` ${minutes} min` : ''}`
    : `${minutes} minutes`;
  
  return (
    <div className="mt-4 p-4 border rounded-md bg-muted/30">
      <h4 className="font-medium text-lg">Selected Time Slot:</h4>
      <div className="flex items-center mt-2">
        <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
        <span>{format(selectedSlot.day, 'EEEE, MMMM d, yyyy')}</span>
      </div>
      <div className="flex items-center mt-2">
        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
        <span className="font-medium">
          {selectedSlot.start} - {selectedSlot.end} ({durationText})
        </span>
      </div>
    </div>
  );
};
