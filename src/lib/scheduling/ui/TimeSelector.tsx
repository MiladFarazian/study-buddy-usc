
import React from 'react';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface TimeSlot {
  time: string;
  available: boolean;
}

interface TimeSelectorProps {
  timeSlots: TimeSlot[];
  selectedTime: string | null;
  onTimeChange: (time: string) => void;
}

export function TimeSelector({ timeSlots, selectedTime, onTimeChange }: TimeSelectorProps) {
  // Group time slots by hour
  const groupSlotsByHour = () => {
    const grouped: { [hour: string]: TimeSlot[] } = {};
    
    timeSlots.filter(slot => slot.available).forEach(slot => {
      const hourStr = slot.time.split(':')[0];
      if (!grouped[hourStr]) {
        grouped[hourStr] = [];
      }
      grouped[hourStr].push(slot);
    });
    
    return grouped;
  };
  
  const groupedSlots = groupSlotsByHour();
  const hasAvailableSlots = timeSlots.some(slot => slot.available);

  // Helper function to format time for display (e.g. "13:30" -> "1:30 PM")
  const formatTimeForDisplay = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Select a Time</h2>
      
      <div className="h-72 overflow-y-auto pr-2">
        {!hasAvailableSlots ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Clock className="h-8 w-8 mb-2" />
            <p>No available slots for this date.</p>
            <p className="text-sm mt-1">Please select another date.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedSlots).map(([hour, hourSlots]) => (
              <div key={hour} className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">
                  {parseInt(hour) < 12 ? parseInt(hour) : parseInt(hour) - 12}:00 {parseInt(hour) >= 12 ? 'PM' : 'AM'}
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {hourSlots.map((slot, index) => (
                    <button
                      key={`${slot.time}-${index}`}
                      className={cn(
                        "flex justify-center items-center p-2 rounded-md border transition-colors",
                        selectedTime === slot.time 
                          ? "border-usc-cardinal bg-red-50 text-usc-cardinal" 
                          : "hover:border-usc-cardinal hover:bg-red-50/50"
                      )}
                      onClick={() => onTimeChange(slot.time)}
                    >
                      <span>{formatTimeForDisplay(slot.time)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
