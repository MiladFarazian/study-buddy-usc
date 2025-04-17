
import { Button } from "@/components/ui/button";
import { BookingSlot } from "@/lib/scheduling/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isBefore, isToday, parseISO } from "date-fns";
import { Clock } from "lucide-react";

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
  // Format time for display (e.g., "2:30 PM")
  const formatTime = (timeString: string) => {
    const [hour, minute] = timeString.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
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

  // Group time slots by hour to improve UI organization
  const groupSlotsByHour = () => {
    const grouped: { [hour: string]: BookingSlot[] } = {};
    
    validSlots.forEach(slot => {
      const hourStr = slot.start.split(':')[0];
      if (!grouped[hourStr]) {
        grouped[hourStr] = [];
      }
      grouped[hourStr].push(slot);
    });
    
    return grouped;
  };
  
  const groupedSlots = groupSlotsByHour();

  // Check if slot is selected
  const isSlotSelected = (slot: BookingSlot): boolean => {
    if (!selectedSlot) return false;
    
    const slotDay = slot.day instanceof Date ? slot.day : new Date(slot.day);
    const selectedDay = selectedSlot.day instanceof Date ? selectedSlot.day : new Date(selectedSlot.day);
    
    return (
      slotDay.toDateString() === selectedDay.toDateString() &&
      slot.start === selectedSlot.start &&
      slot.end === selectedSlot.end
    );
  };

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
          <div className="p-4 space-y-6">
            {Object.entries(groupedSlots).map(([hour, hourSlots]) => (
              <div key={hour} className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">
                  {parseInt(hour) < 12 ? parseInt(hour) : parseInt(hour) - 12}:00 {parseInt(hour) >= 12 ? 'PM' : 'AM'}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {hourSlots.map((slot, index) => (
                    <Button
                      key={`${slot.day}-${slot.start}-${index}`}
                      variant={isSlotSelected(slot) ? "default" : "outline"}
                      className={`
                        h-12 flex items-center justify-center
                        ${isSlotSelected(slot) ? "bg-usc-cardinal hover:bg-usc-cardinal-dark" : "hover:bg-secondary"}
                      `}
                      onClick={() => onSelectSlot(slot)}
                      disabled={disabled}
                    >
                      <span className="text-sm font-medium">{formatTime(slot.start)}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
