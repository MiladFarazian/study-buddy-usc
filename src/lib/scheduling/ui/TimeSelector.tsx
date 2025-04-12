
import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, parse, isBefore, isToday } from 'date-fns';
import { Clock } from "lucide-react";

export interface TimeSlot {
  time: string; // Format: "HH:mm" (24-hour)
  available: boolean;
}

interface TimeSelectorProps {
  availableTimeSlots: TimeSlot[];
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
  className?: string;
  selectedDate?: Date;
}

export function TimeSelector({ 
  availableTimeSlots, 
  selectedTime, 
  onSelectTime,
  className,
  selectedDate
}: TimeSelectorProps) {
  // Function to format time from 24-hour to 12-hour format
  const formatTimeDisplay = (time24: string): string => {
    try {
      const timeObj = parse(time24, 'HH:mm', new Date());
      return format(timeObj, 'h:mm a');
    } catch (error) {
      console.error("Error formatting time:", error);
      return time24; // Return original format if parsing fails
    }
  };

  // Check if a time slot is in the past for today
  const isTimeSlotInPast = (timeString: string): boolean => {
    // If no date is selected or it's not today, return false
    if (!selectedDate || !isToday(selectedDate)) return false;
    
    // Get current time
    const now = new Date();
    
    // Parse the time string
    const [hour, minute] = timeString.split(':').map(Number);
    
    // Create a date object with the time
    const timeDate = new Date(selectedDate);
    timeDate.setHours(hour, minute, 0, 0);
    
    // Check if the time is in the past
    return isBefore(timeDate, now);
  };

  // Filter out past time slots
  const validTimeSlots = availableTimeSlots.filter(slot => 
    slot.available && !isTimeSlotInPast(slot.time)
  );

  return (
    <div className={cn("space-y-2 w-full", className)}>
      {validTimeSlots.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border rounded-md bg-gray-50">
          <Clock className="h-6 w-6 text-muted-foreground mb-2" />
          <p className="text-gray-500 text-center">
            No available time slots for this date. Please select another date.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-w-full">
          {validTimeSlots.map((slot) => (
            <Button
              key={slot.time}
              variant="outline"
              className={cn(
                "h-14 w-full justify-center text-base overflow-hidden",
                selectedTime === slot.time 
                  ? "bg-usc-cardinal text-white border-usc-cardinal" 
                  : "bg-white"
              )}
              onClick={() => onSelectTime(slot.time)}
            >
              <span className="truncate">
                {formatTimeDisplay(slot.time)}
              </span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
