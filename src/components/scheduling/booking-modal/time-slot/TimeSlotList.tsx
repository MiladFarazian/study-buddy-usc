
import { BookingSlot } from "@/lib/scheduling";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface TimeSlotListProps {
  availableTimeSlots: BookingSlot[];
  selectedTimeSlot: BookingSlot | null;
  onSelectTimeSlot: (slot: BookingSlot) => void;
  formatTimeForDisplay: (time: string) => string;
}

export const TimeSlotList = ({
  availableTimeSlots,
  selectedTimeSlot,
  onSelectTimeSlot,
  formatTimeForDisplay
}: TimeSlotListProps) => {
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
  
  // Function to check if a slot is selected
  const isSlotSelected = (slot: BookingSlot) => {
    if (!selectedTimeSlot) return false;
    return (
      selectedTimeSlot.day.toString() === slot.day.toString() &&
      selectedTimeSlot.start === slot.start &&
      selectedTimeSlot.end === slot.end
    );
  };
  
  // Render a time slot group
  const renderTimeGroup = (slots: BookingSlot[], title: string) => {
    if (slots.length === 0) return null;
    
    return (
      <div className="mb-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">{title}</h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {slots.map((slot, index) => (
            <Button
              key={`${slot.start}-${index}`}
              variant="outline"
              size="sm"
              className={cn(
                "h-10",
                isSlotSelected(slot) && "bg-usc-cardinal text-white hover:bg-usc-cardinal-dark"
              )}
              onClick={() => onSelectTimeSlot(slot)}
            >
              {formatTimeForDisplay(slot.start)}
            </Button>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Select a Time</h3>
      </div>
      
      {availableTimeSlots.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 border rounded-md bg-muted/30">
          <Clock className="h-6 w-6 text-muted-foreground mb-2" />
          <p className="text-muted-foreground text-center">
            No available time slots for this date. Please select another date.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {renderTimeGroup(morningSlots, "Morning")}
          {renderTimeGroup(afternoonSlots, "Afternoon")}
          {renderTimeGroup(eveningSlots, "Evening")}
        </div>
      )}
      
      {selectedTimeSlot && (
        <div className="mt-4 p-3 bg-muted rounded-md text-center">
          <p className="text-sm">
            Selected time: <span className="font-medium">{formatTimeForDisplay(selectedTimeSlot.start)}</span>
          </p>
        </div>
      )}
    </div>
  );
};
