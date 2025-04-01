
import React from 'react';
import { format } from 'date-fns';
import { BookingSlot } from '@/types/scheduling';

interface SelectedTimeDisplayProps {
  selectedSlot: BookingSlot | null;
}

export const SelectedTimeDisplay: React.FC<SelectedTimeDisplayProps> = ({
  selectedSlot
}) => {
  if (!selectedSlot) return null;

  return (
    <div className="mt-4 p-3 border rounded-md bg-muted/30">
      <p className="font-medium">Selected Time Slot:</p>
      <p className="mt-1">
        {format(selectedSlot.day, 'EEEE, MMMM d, yyyy')} at {selectedSlot.start} - {selectedSlot.end}
      </p>
    </div>
  );
};
