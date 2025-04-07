
import { Button } from "@/components/ui/button";
import { BookingSlot } from "@/lib/scheduling/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

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

  return (
    <ScrollArea className="h-[300px] rounded-md border">
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {slots.map((slot, index) => (
          <Button
            key={`${slot.day}-${slot.start}-${index}`}
            variant="outline"
            className="h-16 flex flex-col items-center justify-center hover:bg-secondary"
            onClick={() => onSelectSlot(slot)}
            disabled={disabled || !slot.available}
          >
            <span className="text-sm font-medium">{formatTime(slot.start)}</span>
            <span className="text-xs text-muted-foreground">to {formatTime(slot.end)}</span>
          </Button>
        ))}
        
        {slots.length === 0 && (
          <div className="col-span-3 py-8 text-center text-muted-foreground">
            No available time slots for this date.
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
