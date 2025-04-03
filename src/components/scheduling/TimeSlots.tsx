
import { useState, useEffect } from 'react';
import { format, parseISO, addMinutes } from 'date-fns';
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

  const formatTimeRange = (start: string, end: string) => {
    try {
      const startDate = parseISO(`2000-01-01T${start}`);
      const endDate = parseISO(`2000-01-01T${end}`);
      return `${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}`;
    } catch (error) {
      console.error("Error formatting time range:", error);
      return `${start} - ${end}`;
    }
  };

  const calculateDuration = (start: string, end: string) => {
    try {
      const startDate = parseISO(`2000-01-01T${start}`);
      const endDate = parseISO(`2000-01-01T${end}`);
      const minutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
      return `${minutes} min`;
    } catch (error) {
      console.error("Error calculating duration:", error);
      return "Unknown duration";
    }
  };

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
    <div className="space-y-2">
      {slots.map((slot, i) => {
        const slotDay = slot.day instanceof Date ? slot.day : new Date(slot.day);
        const isSelected = selectedSlot && 
          (selectedSlot.day instanceof Date ? 
            selectedSlot.day.toISOString() === slotDay.toISOString() :
            selectedSlot.day === slot.day) && 
          selectedSlot.start === slot.start;

        return (
          <Button
            key={`${format(slotDay, 'yyyy-MM-dd')}-${slot.start}-${i}`}
            type="button"
            variant={isSelected ? "default" : "outline"}
            className={cn(
              "w-full justify-between h-auto py-3 px-4",
              isSelected && "bg-usc-cardinal text-white hover:bg-usc-cardinal-dark"
            )}
            onClick={() => onSelectSlot(slot)}
          >
            <div className="flex items-center">
              <Clock className={cn(
                "mr-2 h-4 w-4",
                isSelected ? "text-white" : "text-muted-foreground"
              )} />
              <span>{formatTimeRange(slot.start, slot.end)}</span>
            </div>
            <span className={cn(
              "text-sm",
              isSelected ? "text-white" : "text-muted-foreground"
            )}>
              {calculateDuration(slot.start, slot.end)}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
