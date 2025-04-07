import { BookingSlot } from "@/lib/scheduling";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";

export interface TimeSlotListProps {
  slots: BookingSlot[];
  onSelectSlot: (slot: BookingSlot) => void;
  disabled?: boolean;
  selectedDuration?: number;
  formatTimeForDisplay?: (time: string) => string;
  isLoading?: boolean;
  selectedTimeSlot?: BookingSlot | null;
}

export const TimeSlotList = ({
  slots,
  selectedTimeSlot = null,
  selectedDuration = 60,
  onSelectSlot,
  formatTimeForDisplay = (time) => time,
  isLoading = false,
  disabled = false
}: TimeSlotListProps) => {
  const [consecutiveSlots, setConsecutiveSlots] = useState<BookingSlot[]>([]);

  const morningSlots = slots.filter(slot => 
    parseInt(slot.start.split(':')[0]) < 12
  );
  
  const afternoonSlots = slots.filter(slot => 
    parseInt(slot.start.split(':')[0]) >= 12 && parseInt(slot.start.split(':')[0]) < 17
  );
  
  const eveningSlots = slots.filter(slot => 
    parseInt(slot.start.split(':')[0]) >= 17
  );
  
  const isSlotSelected = (slot: BookingSlot) => {
    if (!selectedTimeSlot) return false;
    
    return consecutiveSlots.some(selected => 
      selected.day.toString() === slot.day.toString() &&
      selected.start === slot.start &&
      selected.end === slot.end
    );
  };

  const findConsecutiveSlots = (startSlot: BookingSlot, durationMinutes: number) => {
    const slotsNeeded = Math.ceil(durationMinutes / 30);
    
    if (slotsNeeded <= 1) return [startSlot];
    
    const sameDay = slots.filter(slot => 
      new Date(slot.day).toDateString() === new Date(startSlot.day).toDateString()
    );
    
    sameDay.sort((a, b) => a.start.localeCompare(b.start));
    
    const startIndex = sameDay.findIndex(slot => 
      slot.start === startSlot.start && slot.end === startSlot.end
    );
    
    if (startIndex === -1) return [startSlot];
    
    const result = [startSlot];
    let currentSlot = startSlot;
    
    for (let i = 1; i < slotsNeeded; i++) {
      const nextSlot = sameDay.find(slot => 
        slot.start === currentSlot.end && slot.available
      );
      
      if (!nextSlot) break;
      
      result.push(nextSlot);
      currentSlot = nextSlot;
    }
    
    return result;
  };
  
  const handleSlotSelect = (slot: BookingSlot) => {
    const slots = findConsecutiveSlots(slot, selectedDuration);
    setConsecutiveSlots(slots);
    
    if (slots.length > 0) {
      const firstSlot = slots[0];
      const lastSlot = slots[slots.length - 1];
      
      const mergedSlot: BookingSlot = {
        ...firstSlot,
        end: lastSlot.end
      };
      
      onSelectSlot(mergedSlot);
    } else {
      onSelectSlot(slot);
    }
  };
  
  useEffect(() => {
    if (selectedTimeSlot && selectedDuration > 0) {
      const startSlot = slots.find(slot => 
        slot.day.toString() === selectedTimeSlot.day.toString() &&
        slot.start === selectedTimeSlot.start
      );
      
      if (startSlot) {
        const slots = findConsecutiveSlots(startSlot, selectedDuration);
        setConsecutiveSlots(slots);
        
        if (slots.length > 0 && 
            (slots[slots.length - 1].end !== selectedTimeSlot.end)) {
          const firstSlot = slots[0];
          const lastSlot = slots[slots.length - 1];
          
          const mergedSlot: BookingSlot = {
            ...firstSlot,
            end: lastSlot.end
          };
          
          onSelectSlot(mergedSlot);
        }
      }
    }
  }, [selectedDuration, slots, selectedTimeSlot, onSelectSlot]);
  
  const renderTimeGroup = (slots: BookingSlot[], title: string) => {
    if (slots.length === 0) return null;
    
    return (
      <div className="mb-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">{title}</h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 w-full">
          {slots.map((slot, index) => (
            <Button
              key={`${slot.start}-${index}`}
              variant="outline"
              size="sm"
              className={cn(
                "h-10 w-full overflow-hidden",
                isSlotSelected(slot) && "bg-usc-cardinal text-white hover:bg-usc-cardinal-dark"
              )}
              onClick={() => handleSlotSelect(slot)}
            >
              {formatTimeForDisplay(slot.start)}
            </Button>
          ))}
        </div>
      </div>
    );
  };
  
  const DurationSelector = () => (
    <div className="mt-4 mb-4">
      <h4 className="text-sm font-medium text-muted-foreground mb-2">Session Duration</h4>
      <div className="flex space-x-2">
        {[30, 60, 90, 120].map(duration => (
          <Button
            key={duration}
            variant={selectedDuration === duration ? "default" : "outline"}
            size="sm"
            className={selectedDuration === duration ? "bg-usc-cardinal hover:bg-usc-cardinal-dark" : ""}
            onClick={() => {
              if (selectedTimeSlot) {
                const slots = findConsecutiveSlots(selectedTimeSlot, duration);
                if (slots.length > 0) {
                  const firstSlot = slots[0];
                  const lastSlot = slots[slots.length - 1];
                  
                  const mergedSlot: BookingSlot = {
                    ...firstSlot,
                    end: lastSlot.end
                  };
                  
                  onSelectSlot(mergedSlot);
                }
              }
            }}
          >
            {duration === 60 ? "1 hour" : duration === 120 ? "2 hours" : `${duration} min`}
          </Button>
        ))}
      </div>
    </div>
  );
  
  return (
    <div className="space-y-3 w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Select a Time</h3>
      </div>
      
      <DurationSelector />
      
      <ScrollArea className="max-h-[40vh]">
        <div className="pr-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-6 border rounded-md bg-muted/30">
              <Loader2 className="h-6 w-6 text-muted-foreground mb-2 animate-spin" />
              <p className="text-muted-foreground text-center">
                Loading available time slots...
              </p>
            </div>
          ) : slots.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 border rounded-md bg-muted/30">
              <Clock className="h-6 w-6 text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-center">
                No available time slots for this date. Please select another date.
              </p>
            </div>
          ) : (
            <div className="space-y-3 w-full">
              {renderTimeGroup(morningSlots, "Morning")}
              {renderTimeGroup(afternoonSlots, "Afternoon")}
              {renderTimeGroup(eveningSlots, "Evening")}
            </div>
          )}
        </div>
      </ScrollArea>
      
      {selectedTimeSlot && (
        <div className="mt-4 p-3 bg-muted rounded-md text-center">
          <p className="text-sm">
            Selected time: <span className="font-medium">
              {formatTimeForDisplay(selectedTimeSlot.start)} - {formatTimeForDisplay(selectedTimeSlot.end)}
            </span>
            <span className="ml-2 text-muted-foreground">
              ({Math.round((selectedDuration / 60) * 10) / 10} {selectedDuration === 60 ? 'hour' : 'hours'})
            </span>
          </p>
        </div>
      )}
    </div>
  );
};
