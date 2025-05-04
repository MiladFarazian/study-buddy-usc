
import { Button } from "@/components/ui/button";
import { BookingSlot } from "@/lib/scheduling/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock } from "lucide-react";
import { formatTimeDisplay } from "@/lib/scheduling/time-utils";
import { format } from "date-fns";

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
  // Filter for available slots and those matching the selected date
  const validSlots = slots.filter(slot => {
    const isAvailable = slot.available;
    
    // If we have a selected slot, filter by matching date
    if (selectedSlot) {
      const slotDay = slot.day instanceof Date ? slot.day : new Date(slot.day);
      const selectedDay = selectedSlot.day instanceof Date ? 
        selectedSlot.day : new Date(selectedSlot.day);
      
      return isAvailable && 
        format(slotDay, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd');
    }
    
    return isAvailable;
  });
  
  // Create a unique key for each time slot and remove duplicates
  const uniqueSlots = validSlots.reduce((unique: BookingSlot[], slot) => {
    const slotDay = slot.day instanceof Date ? slot.day : new Date(slot.day);
    const dayStr = format(slotDay, 'yyyy-MM-dd');
    const key = `${dayStr}-${slot.start}`;
    
    // Check if we already have this time slot
    const exists = unique.some(existingSlot => {
      const existingDay = existingSlot.day instanceof Date ? existingSlot.day : new Date(existingSlot.day);
      const existingDayStr = format(existingDay, 'yyyy-MM-dd');
      return existingDayStr === dayStr && existingSlot.start === slot.start;
    });
    
    if (!exists) {
      unique.push(slot);
    }
    
    return unique;
  }, []);
  
  // Sort by start time
  const sortedUniqueSlots = uniqueSlots.sort((a, b) => a.start.localeCompare(b.start));

  console.log("TimeSlotList rendered with", slots.length, "total slots,", validSlots.length, "valid slots, and", sortedUniqueSlots.length, "unique slots");

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold flex items-center">
        <Clock className="mr-2 h-5 w-5" />
        Select a Time
      </h3>
      
      {sortedUniqueSlots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/30 rounded-md">
          <Clock className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No available time slots for this date.</p>
        </div>
      ) : (
        <ScrollArea className="h-[300px] rounded-md border">
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {sortedUniqueSlots.map((slot, index) => (
                <Button
                  key={`${index}-${slot.start}`}
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
    format(slotDay, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd') &&
    slot.start === selectedSlot.start &&
    slot.end === selectedSlot.end
  );
}
