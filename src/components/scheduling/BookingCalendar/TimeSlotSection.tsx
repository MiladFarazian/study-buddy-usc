
import { parseISO, format, differenceInMinutes } from "date-fns";
import { Clock, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BookingSlot } from "@/lib/scheduling";
import { formatTimeDisplay } from "@/lib/scheduling/time-utils";

interface TimeSlotSectionProps {
  visibleSlots: BookingSlot[];
  selectedSlot: BookingSlot | null;
  handleSelectSlot: (slot: BookingSlot) => void;
}

export const TimeSlotSection = ({ 
  visibleSlots, 
  selectedSlot, 
  handleSelectSlot 
}: TimeSlotSectionProps) => {
  // Group time slots by hour
  const groupSlotsByHour = () => {
    const grouped: { [hour: string]: BookingSlot[] } = {};
    
    visibleSlots.filter(slot => slot.available).forEach(slot => {
      const hourStr = slot.start.split(':')[0];
      if (!grouped[hourStr]) {
        grouped[hourStr] = [];
      }
      grouped[hourStr].push(slot);
    });
    
    return grouped;
  };
  
  const groupedSlots = groupSlotsByHour();
  const hasAvailableSlots = visibleSlots.some(slot => slot.available);

  // Check if slot is selected
  const isSlotSelected = (slot: BookingSlot): boolean => {
    if (!selectedSlot) return false;
    
    const slotDay = slot.day instanceof Date ? slot.day : new Date(slot.day);
    const selectedDay = selectedSlot.day instanceof Date ? 
      selectedSlot.day : new Date(selectedSlot.day);
    
    return (
      format(slotDay, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd') &&
      slot.start === selectedSlot.start &&
      slot.end === selectedSlot.end
    );
  };

  return (
    <div>
      <p className="text-sm font-medium mb-2">Available Time Slots:</p>
      <div className="h-64 overflow-y-auto pr-2 border rounded-md p-2">
        {!hasAvailableSlots ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <CalendarDays className="h-8 w-8 mb-2" />
            <p>No available slots for this date.</p>
            <p className="text-sm mt-1">Please select another date.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedSlots).map(([hour, hourSlots]) => (
              <div key={hour} className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">
                  {parseInt(hour) < 12 ? parseInt(hour) : parseInt(hour) - 12}:00 {parseInt(hour) >= 12 ? 'PM' : 'AM'}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {hourSlots
                    .sort((a, b) => (a.start > b.start ? 1 : -1))
                    .map((slot, index) => {
                      const slotDay = slot.day instanceof Date ? slot.day : new Date(slot.day);
                      const isSelected = isSlotSelected(slot);

                      return (
                        <div
                          key={`${format(slotDay, 'yyyy-MM-dd')}-${slot.start}-${index}`}
                          className={`
                            rounded-md border p-3 cursor-pointer transition-colors
                            ${isSelected ? 'border-usc-cardinal bg-red-50' : 'hover:border-usc-cardinal hover:bg-red-50/50'}
                          `}
                          onClick={() => handleSelectSlot(slot)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{formatTimeDisplay(slot.start)}</p>
                              <p className="text-xs text-muted-foreground">30 min</p>
                            </div>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              Available
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
