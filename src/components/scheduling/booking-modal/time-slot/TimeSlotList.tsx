
import { BookingSlot } from "@/lib/scheduling";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";

interface TimeSlotListProps {
  availableTimeSlots: BookingSlot[];
  selectedTimeSlot: BookingSlot | null;
  selectedDuration: number;
  onSelectTimeSlot: (slot: BookingSlot) => void;
  formatTimeForDisplay: (time: string) => string;
  isLoading: boolean;
}

export const TimeSlotList = ({
  availableTimeSlots,
  selectedTimeSlot,
  selectedDuration,
  onSelectTimeSlot,
  formatTimeForDisplay,
  isLoading = false
}: TimeSlotListProps) => {
  const [consecutiveSlots, setConsecutiveSlots] = useState<BookingSlot[]>([]);

  // Group slots by morning, afternoon, evening
  const morningSlots = availableTimeSlots.filter(slot => 
    parseInt(slot.start.split(':')[0]) < 12
  );
  
  const afternoonSlots = availableTimeSlots.filter(slot => 
    parseInt(slot.start.split(':')[0]) >= 12 && parseInt(slot.start.split(':')[0]) < 17
  );
  
  const eveningSlots = availableTimeSlots.filter(slot => 
    parseInt(slot.start.split(':')[0]) >= 17
  );
  
  // Function to check if a slot is part of the selected continuous slots
  const isSlotSelected = (slot: BookingSlot) => {
    if (!selectedTimeSlot) return false;
    
    // Check if this slot is in the consecutive slots array
    return consecutiveSlots.some(selected => 
      selected.day.toString() === slot.day.toString() &&
      selected.start === slot.start &&
      selected.end === slot.end
    );
  };

  // Function to find all consecutive slots starting from a selected slot
  const findConsecutiveSlots = (startSlot: BookingSlot, durationMinutes: number) => {
    // Calculate how many 30-minute slots we need
    const slotsNeeded = Math.ceil(durationMinutes / 30);
    
    if (slotsNeeded <= 1) return [startSlot];
    
    // Get all slots for the same day
    const sameDay = availableTimeSlots.filter(slot => 
      new Date(slot.day).toDateString() === new Date(startSlot.day).toDateString()
    );
    
    // Sort by start time
    sameDay.sort((a, b) => a.start.localeCompare(b.start));
    
    // Find the index of our starting slot
    const startIndex = sameDay.findIndex(slot => 
      slot.start === startSlot.start && slot.end === startSlot.end
    );
    
    if (startIndex === -1) return [startSlot];
    
    // Check if we have enough consecutive slots
    const result = [startSlot];
    let currentSlot = startSlot;
    
    for (let i = 1; i < slotsNeeded; i++) {
      // Find the next slot that starts when the current one ends
      const nextSlot = sameDay.find(slot => 
        slot.start === currentSlot.end && slot.available
      );
      
      if (!nextSlot) break;
      
      result.push(nextSlot);
      currentSlot = nextSlot;
    }
    
    return result;
  };
  
  // Handle slot selection with duration
  const handleSlotSelect = (slot: BookingSlot) => {
    const slots = findConsecutiveSlots(slot, selectedDuration);
    setConsecutiveSlots(slots);
    
    // If we couldn't get the full duration, we'll use what we have
    // No need to set selectedDuration anymore as it's now controlled by parent
    
    // Create a merged slot for the entire duration
    if (slots.length > 0) {
      const firstSlot = slots[0];
      const lastSlot = slots[slots.length - 1];
      
      const mergedSlot: BookingSlot = {
        ...firstSlot,
        end: lastSlot.end
      };
      
      onSelectTimeSlot(mergedSlot);
    } else {
      onSelectTimeSlot(slot);
    }
  };
  
  // No longer handling duration changes internally - parent controls this
  
  // Ensure any slot selection updates maintain consistent duration
  useEffect(() => {
    if (selectedTimeSlot && selectedDuration > 0) {
      // Find the starting slot
      const startSlot = availableTimeSlots.find(slot => 
        slot.day.toString() === selectedTimeSlot.day.toString() &&
        slot.start === selectedTimeSlot.start
      );
      
      if (startSlot) {
        // Get consecutive slots for current duration
        const slots = findConsecutiveSlots(startSlot, selectedDuration);
        setConsecutiveSlots(slots);
        
        // Update the merged slot if the consecutive slots changed
        if (slots.length > 0 && 
            (slots[slots.length - 1].end !== selectedTimeSlot.end)) {
          const firstSlot = slots[0];
          const lastSlot = slots[slots.length - 1];
          
          const mergedSlot: BookingSlot = {
            ...firstSlot,
            end: lastSlot.end
          };
          
          onSelectTimeSlot(mergedSlot);
        }
      }
    }
  }, [selectedDuration, availableTimeSlots, selectedTimeSlot, onSelectTimeSlot]);
  
  // Render a time slot group
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
  
  // Duration selector component to display current duration
  // Now it doesn't set the duration but informs parent about button clicks
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
            // Just pass the selected duration to the parent component via onSelectTimeSlot
            onClick={() => {
              if (selectedTimeSlot) {
                // Recalculate consecutive slots with new duration
                const slots = findConsecutiveSlots(selectedTimeSlot, duration);
                if (slots.length > 0) {
                  const firstSlot = slots[0];
                  const lastSlot = slots[slots.length - 1];
                  
                  const mergedSlot: BookingSlot = {
                    ...firstSlot,
                    end: lastSlot.end
                  };
                  
                  // This will trigger the parent to update the duration
                  onSelectTimeSlot(mergedSlot);
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
          ) : availableTimeSlots.length === 0 ? (
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
