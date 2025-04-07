
import { parseISO, format, differenceInMinutes } from "date-fns";
import { Clock, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BookingSlot } from "@/lib/scheduling";

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
  return (
    <div>
      <p className="text-sm font-medium mb-2">Available Time Slots:</p>
      <div className="h-64 overflow-y-auto pr-2 border rounded-md p-2">
        {visibleSlots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <CalendarDays className="h-8 w-8 mb-2" />
            <p>No available slots for this date.</p>
            <p className="text-sm mt-1">Please select another date.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleSlots
              .filter(slot => slot.available)
              .sort((a, b) => (a.start > b.start ? 1 : -1))
              .map((slot, index) => {
                const startTime = parseISO(`2000-01-01T${slot.start}`);
                const endTime = parseISO(`2000-01-01T${slot.end}`);
                const durationMins = differenceInMinutes(endTime, startTime);
                const slotDay = slot.day instanceof Date ? slot.day : new Date(slot.day);
                
                return (
                  <div
                    key={`${format(slotDay, 'yyyy-MM-dd')}-${slot.start}-${index}`}
                    className={`
                      rounded-md border p-3 cursor-pointer transition-colors
                      ${selectedSlot && 
                        selectedSlot.day instanceof Date && slotDay instanceof Date ?
                        (selectedSlot.day.getTime() === slotDay.getTime() && 
                        selectedSlot.start === slot.start
                        ? 'border-usc-cardinal bg-red-50' : '')
                        : 'hover:border-usc-cardinal hover:bg-red-50/50'
                      }
                    `}
                    onClick={() => handleSelectSlot(slot)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{slot.start} - {slot.end}</p>
                        <div className="flex items-center mt-1 text-muted-foreground text-sm">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          <span>{durationMins} minutes</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Available
                      </Badge>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};
