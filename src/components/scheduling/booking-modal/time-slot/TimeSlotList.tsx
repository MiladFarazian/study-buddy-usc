
import { Button } from "@/components/ui/button";
import { BookingSlot } from "@/lib/scheduling/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isBefore, isToday } from "date-fns";

export interface TimeSlotListProps {
  slots: BookingSlot[];
  onSelectSlot: (slot: BookingSlot) => void;
  disabled?: boolean;
}

export function TimeSlotList({ slots, onSelectSlot, disabled = false }: TimeSlotListProps) {
  // Format time for display (e.g., "2:30 PM")
  const formatTime = (timeString: string) => {
    const [hour, minute] = timeString.split(':').map(Number);
    return format(new Date().setHours(hour, minute), 'h:mm a');
  };

  // Check if a time slot is in the past
  const isTimeSlotInPast = (slot: BookingSlot): boolean => {
    const slotDay = slot.day instanceof Date ? slot.day : new Date(slot.day);
    
    // If it's not today, then past dates are already filtered out
    if (!isToday(slotDay)) return false;
    
    // Get the current time
    const now = new Date();
    
    // Parse the slot's start time
    const [hour, minute] = slot.start.split(':').map(Number);
    const slotTime = new Date();
    slotTime.setHours(hour, minute, 0, 0);
    
    // Check if this time is already in the past
    return isBefore(slotTime, now);
  };

  // Filter out slots that are in the past
  const validSlots = slots.filter(slot => slot.available && !isTimeSlotInPast(slot));

  return (
    <ScrollArea className="h-[300px] rounded-md border">
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {validSlots.map((slot, index) => (
          <Button
            key={`${slot.day}-${slot.start}-${index}`}
            variant="outline"
            className="h-16 flex flex-col items-center justify-center hover:bg-secondary"
            onClick={() => onSelectSlot(slot)}
            disabled={disabled}
          >
            <span className="text-sm font-medium">{formatTime(slot.start)}</span>
            <span className="text-xs text-muted-foreground">to {formatTime(slot.end)}</span>
          </Button>
        ))}
        
        {validSlots.length === 0 && (
          <div className="col-span-3 py-8 text-center text-muted-foreground">
            No available time slots for this date.
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
