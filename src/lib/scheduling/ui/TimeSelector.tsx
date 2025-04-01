
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from 'date-fns';

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
  // Helper to format time for display
  const formatTime = (time: string) => {
    try {
      const timeObj = parseISO(`2000-01-01T${time}`);
      return format(timeObj, 'h:mm a');
    } catch (e) {
      return time;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select a Time</CardTitle>
      </CardHeader>
      <CardContent>
        {availableTimeSlots.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No available time slots for the selected date.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {availableTimeSlots.map((slot, index) => (
              <button
                key={`${slot.time}-${index}`}
                className={`
                  p-3 rounded-md border text-center transition-colors
                  ${selectedTime === slot.time
                    ? 'bg-usc-cardinal text-white border-usc-cardinal'
                    : 'bg-background hover:bg-muted/50 border-input'
                  }
                  ${!slot.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                onClick={() => slot.available && onSelectTime(slot.time)}
                disabled={!slot.available}
              >
                {formatTime(slot.time)}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
