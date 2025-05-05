
import { useState, useMemo } from "react";
import { BookingSlot } from "@/lib/scheduling/types";
import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Clock, Calendar } from "lucide-react";

interface TimeSlotListProps {
  slots: BookingSlot[];
  onSelectSlot: (slot: BookingSlot) => void;
  selectedSlot: BookingSlot | null;
  selectedDate: Date;
}

export function TimeSlotList({
  slots,
  onSelectSlot,
  selectedSlot,
  selectedDate
}: TimeSlotListProps) {
  // Filter slots for the selected date and group them by time
  const availableTimeSlots = useMemo(() => {
    // Filter slots for selected date
    const filteredSlots = slots.filter(slot => 
      slot.available && 
      slot.day instanceof Date && 
      isSameDay(slot.day, selectedDate)
    );

    console.log(`TimeSlotList: ${filteredSlots.length} slots available for ${format(selectedDate, 'yyyy-MM-dd')}`);
    
    // Group slots by start time
    const timeGroups: { [key: string]: BookingSlot[] } = {};
    filteredSlots.forEach(slot => {
      const startTime = slot.start;
      if (!timeGroups[startTime]) {
        timeGroups[startTime] = [];
      }
      timeGroups[startTime].push(slot);
    });

    // Sort times chronologically
    const sortedTimes = Object.keys(timeGroups).sort((a, b) => {
      const aHour = parseInt(a.split(':')[0]);
      const aMinute = parseInt(a.split(':')[1]);
      const bHour = parseInt(b.split(':')[0]);
      const bMinute = parseInt(b.split(':')[1]);
      
      return (aHour - bHour) || (aMinute - bMinute);
    });
    
    return sortedTimes.map(time => {
      // For each time, return the first available slot
      return timeGroups[time][0];
    });
  }, [slots, selectedDate]);

  const handleSelectTime = (slot: BookingSlot) => {
    onSelectSlot(slot);
  };
  
  // Format time display
  const formatTimeDisplay = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour = hours % 12 || 12;
    return `${hour}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Helper function to check if a slot is currently selected
  const isSlotSelected = (slot: BookingSlot): boolean => {
    if (!selectedSlot) return false;
    return selectedSlot.start === slot.start && 
           selectedSlot.end === slot.end && 
           isSameDay(slot.day, selectedSlot.day);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Available Time Slots</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {availableTimeSlots.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {availableTimeSlots.map((slot, index) => (
            <button
              key={`${slot.start}-${index}`}
              className={cn(
                "py-4 px-3 border rounded-md text-center transition-colors",
                "hover:border-usc-cardinal focus:outline-none focus:ring-2 focus:ring-usc-cardinal",
                isSlotSelected(slot)
                  ? "bg-usc-cardinal text-white border-usc-cardinal hover:bg-usc-cardinal-dark"
                  : "bg-white"
              )}
              onClick={() => handleSelectTime(slot)}
            >
              {formatTimeDisplay(slot.start)}
            </button>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center border rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <Calendar className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No available time slots for this date</p>
            <p className="text-sm text-muted-foreground">Try selecting another date</p>
          </div>
        </div>
      )}
      
      <div className="text-center text-sm text-muted-foreground">
        All times shown are in your local timezone
      </div>
    </div>
  );
}
