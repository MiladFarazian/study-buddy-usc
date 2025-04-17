
import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { BookingSlot } from "@/lib/scheduling/types";

interface TimeSlotsProps {
  date: Date | null;
  availableSlots: BookingSlot[];
  selectedSlot: BookingSlot | null;
  onSelectSlot: (slot: BookingSlot) => void;
  isLoading?: boolean;
}

export function TimeSlots({
  date,
  availableSlots,
  selectedSlot,
  onSelectSlot,
  isLoading = false
}: TimeSlotsProps) {
  const [slots, setSlots] = useState<BookingSlot[]>([]);

  useEffect(() => {
    if (!date || !availableSlots.length) {
      setSlots([]);
      return;
    }

    // Filter slots for the selected date
    const filtered = availableSlots.filter(slot => {
      const slotDay = slot.day instanceof Date ? slot.day : new Date(slot.day);
      return (
        slot.available && 
        format(slotDay, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
    });

    // Sort by start time
    const sorted = [...filtered].sort((a, b) => {
      return a.start.localeCompare(b.start);
    });

    setSlots(sorted);
  }, [date, availableSlots]);

  // Format time in 12-hour format
  const formatTime = (timeString: string) => {
    const [hour, minute] = timeString.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  // Group time slots by hour
  const groupSlotsByHour = () => {
    const grouped: { [hour: string]: BookingSlot[] } = {};
    
    slots.forEach(slot => {
      const hourStr = slot.start.split(':')[0];
      if (!grouped[hourStr]) {
        grouped[hourStr] = [];
      }
      grouped[hourStr].push(slot);
    });
    
    return grouped;
  };
  
  const groupedSlots = groupSlotsByHour();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!date) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Please select a date to see available time slots
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No time slots available for {format(date, 'EEEE, MMMM d')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedSlots).map(([hour, hourSlots]) => (
        <div key={hour} className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">
            {parseInt(hour) < 12 ? parseInt(hour) : parseInt(hour) - 12}:00 {parseInt(hour) >= 12 ? 'PM' : 'AM'}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {hourSlots.map((slot, i) => {
              const slotDay = slot.day instanceof Date ? slot.day : new Date(slot.day);
              const isSelected = selectedSlot && 
                (selectedSlot.day instanceof Date ? 
                  format(selectedSlot.day, 'yyyy-MM-dd') === format(slotDay, 'yyyy-MM-dd') :
                  format(new Date(selectedSlot.day), 'yyyy-MM-dd') === format(slotDay, 'yyyy-MM-dd')) && 
                selectedSlot.start === slot.start;

              return (
                <Button
                  key={`${format(slotDay, 'yyyy-MM-dd')}-${slot.start}-${i}`}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "h-12 flex items-center justify-center",
                    isSelected && "bg-usc-cardinal text-white hover:bg-usc-cardinal-dark"
                  )}
                  onClick={() => onSelectSlot(slot)}
                >
                  <span className="text-sm font-medium">{formatTime(slot.start)}</span>
                </Button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
