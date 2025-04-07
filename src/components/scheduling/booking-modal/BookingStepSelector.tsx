
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useBookingState } from "./useBookingState";
import { WeeklyAvailabilityCalendar } from "../calendar/weekly/WeeklyAvailabilityCalendar";
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling/types";
import { formatDate } from "date-fns";

interface BookingStepSelectorProps {
  tutor: Tutor;
  onSelectSlot: (slot: BookingSlot) => void;
  onClose: () => void;
  disabled?: boolean;
}

export function BookingStepSelector({ 
  tutor, 
  onSelectSlot,
  onClose,
  disabled = false
}: BookingStepSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { state, dispatch } = useBookingState();
  
  // Handle slot selection
  const handleSlotSelected = (slot: BookingSlot) => {
    if (disabled) return;
    
    setIsLoading(true);
    
    // Pass the slot to the parent component
    onSelectSlot(slot);
    
    // We'll let the parent component handle the state transition to the next step
    setTimeout(() => setIsLoading(false), 500);
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-md p-4">
        <h3 className="font-medium mb-1">Select a time slot on the calendar</h3>
        <p className="text-sm text-muted-foreground">
          Click a slot and choose a duration to book a session
        </p>
      </div>
      
      <div className="relative">
        {disabled && (
          <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center rounded-md">
            <div className="bg-white p-4 rounded-md shadow text-center">
              <p className="font-medium">Booking temporarily disabled</p>
              <p className="text-sm text-muted-foreground">Please wait a moment before trying again</p>
            </div>
          </div>
        )}
      
        <WeeklyAvailabilityCalendar 
          tutorId={tutor.id}
          onSlotSelected={handleSlotSelected}
          readOnly={false}
          loading={isLoading}
        />
      </div>
      
      <div className="flex justify-end space-x-2 mt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
