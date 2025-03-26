
import { differenceInMinutes, parseISO } from "date-fns";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { BookingSlot } from "@/lib/scheduling";

interface TimeSlotListProps {
  availableTimeSlots: BookingSlot[];
  selectedTimeSlot: BookingSlot | null;
  onSelectTimeSlot: (slot: BookingSlot) => void;
  formatTimeForDisplay: (time24: string) => string;
}

export const TimeSlotList = ({ 
  availableTimeSlots, 
  selectedTimeSlot, 
  onSelectTimeSlot,
  formatTimeForDisplay
}: TimeSlotListProps) => {
  return (
    <div className="space-y-2">
      <Label>2. Select Available Time Block</Label>
      <ScrollArea className="h-[200px] border rounded-md p-2">
        <div className="space-y-2 p-2">
          {availableTimeSlots.map((slot, index) => (
            <Button
              key={index}
              variant="outline"
              className={cn(
                "w-full justify-between text-left",
                selectedTimeSlot === slot && "border-usc-cardinal bg-red-50"
              )}
              onClick={() => onSelectTimeSlot(slot)}
            >
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                <span>
                  {formatTimeForDisplay(slot.start)} - {formatTimeForDisplay(slot.end)}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {differenceInMinutes(
                  parseISO(`2000-01-01T${slot.end}`),
                  parseISO(`2000-01-01T${slot.start}`)
                ) / 60} hours
              </span>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
