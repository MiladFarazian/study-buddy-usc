
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAvailabilityData } from "@/hooks/useAvailabilityData";
import { Tutor } from "@/types/tutor";
import { useScheduling } from "@/contexts/SchedulingContext";
import { DateSelector } from "./booking-modal/date-selector/DateSelector";
import { TimeSlotList } from "./booking-modal/time-slot/TimeSlotList";
import { startOfDay } from "date-fns";
import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";

export interface BookSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutor: Tutor;
  initialDate?: Date;
  initialTime?: string;
}

export function BookSessionModal({
  isOpen,
  onClose,
  tutor,
  initialDate,
  initialTime
}: BookSessionModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const { state, dispatch, setTutor } = useScheduling();
  
  // Initialize starting date
  const today = startOfDay(new Date());
  
  // Fetch availability data
  const { 
    loading, 
    availableSlots, 
    hasAvailability, 
    errorMessage 
  } = useAvailabilityData(tutor, today);

  // Set the tutor in the scheduling context
  useEffect(() => {
    if (tutor && tutor.id) {
      setTutor(tutor);
    }
    
    // Initialize with initial date/time if provided
    if (initialDate) {
      setSelectedDate(initialDate);
    }
  }, [tutor, setTutor, initialDate]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    dispatch({ type: 'SELECT_DATE', payload: date });
  };

  const handleSelectSlot = (slot: any) => {
    dispatch({ type: 'SELECT_TIME_SLOT', payload: slot });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book a Session with {tutor.firstName || tutor.name.split(' ')[0]}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal mr-2" />
              <p>Loading available times...</p>
            </div>
          ) : !hasAvailability ? (
            <div className="text-center py-8">
              <p className="text-lg font-medium mb-2">No Availability Found</p>
              <p className="text-muted-foreground mb-4">
                {errorMessage || "This tutor hasn't set their availability yet."}
              </p>
            </div>
          ) : (
            <>
              <DateSelector 
                date={selectedDate}
                onDateChange={handleDateChange}
                availableSlots={availableSlots}
                isLoading={loading}
              />
              
              {selectedDate && (
                <TimeSlotList
                  slots={availableSlots}
                  onSelectSlot={handleSelectSlot}
                  selectedSlot={state.selectedTimeSlot}
                />
              )}
              
              {state.selectedTimeSlot && (
                <div className="mt-6">
                  <Button 
                    className="w-full bg-usc-cardinal hover:bg-usc-cardinal-dark"
                    onClick={() => {
                      // Handle booking
                      console.log("Booking with selected slot:", state.selectedTimeSlot);
                      // Here we would transition to the next step
                    }}
                  >
                    Continue
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
