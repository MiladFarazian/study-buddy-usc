
import { Button } from "@/components/ui/button";
import { BookingSlot } from "@/lib/scheduling/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock } from "lucide-react";
import { formatTimeDisplay } from "@/lib/scheduling/time-utils";

export interface TimeSlotListProps {
  slots: BookingSlot[];
  onSelectSlot: (slot: BookingSlot) => void;
  selectedSlot?: BookingSlot | null;
  disabled?: boolean;
}

export function TimeSlotList({ 
  slots, 
  onSelectSlot, 
  selectedSlot = null,
  disabled = false 
}: TimeSlotListProps) {
  const validSlots = slots.filter(slot => slot.available)
    .sort((a, b) => a.start.localeCompare(b.start));

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold flex items-center">
        <Clock className="mr-2 h-5 w-5" />
        Select a Time
      </h3>
      
      {validSlots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/30 rounded-md">
          <Clock className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No available time slots for this date.</p>
        </div>
      ) : (
        <ScrollArea className="h-[300px] rounded-md border">
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {validSlots.map((slot, index) => (
                <Button
                  key={index}
                  variant={isSlotSelected(slot, selectedSlot) ? "default" : "outline"}
                  className={`
                    h-12 flex items-center justify-center
                    ${isSlotSelected(slot, selectedSlot) ? "bg-usc-cardinal hover:bg-usc-cardinal-dark" : "hover:bg-secondary"}
                  `}
                  onClick={() => onSelectSlot(slot)}
                  disabled={disabled}
                >
                  <span className="text-sm font-medium">{formatTimeDisplay(slot.start)}</span>
                </Button>
              ))}
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

function isSlotSelected(slot: BookingSlot, selectedSlot: BookingSlot | null): boolean {
  if (!selectedSlot) return false;
  const slotDay = slot.day instanceof Date ? slot.day : new Date(slot.day);
  const selectedDay = selectedSlot.day instanceof Date ? 
    selectedSlot.day : new Date(selectedSlot.day);
  
  return (
    slotDay.toDateString() === selectedDay.toDateString() &&
    slot.start === selectedSlot.start &&
    slot.end === selectedSlot.end
  );
}
