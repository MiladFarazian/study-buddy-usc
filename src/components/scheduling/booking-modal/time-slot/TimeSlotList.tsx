
import { useState, useMemo } from "react";
import { BookingSlot } from "@/lib/scheduling/types";
import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

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
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

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
    setSelectedTime(slot.start);
    onSelectSlot(slot);
  };
  
  // Format time display
  const formatTimeDisplay = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour = hours % 12 || 12;
    return `${hour}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          Select a Time Slot
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Choose from available time slots on {format(selectedDate, 'MMMM d, yyyy')}
        </p>
      </div>

      <div className="border rounded-md">
        {availableTimeSlots.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 p-4">
            {availableTimeSlots.map((slot, index) => (
              <button
                key={`${slot.start}-${index}`}
                className={cn(
                  "py-2 px-3 rounded-md border text-center transition-colors",
                  "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-usc-cardinal",
                  selectedSlot && selectedSlot.id === slot.id
                    ? "bg-usc-cardinal text-white hover:bg-usc-cardinal-dark"
                    : "bg-white"
                )}
                onClick={() => handleSelectTime(slot)}
              >
                {formatTimeDisplay(slot.start)}
              </button>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-muted-foreground">No available time slots for this date</p>
          </div>
        )}
      </div>
    </div>
  );
}
