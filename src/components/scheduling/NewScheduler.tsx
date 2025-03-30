
import React from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SchedulingProvider, useScheduling, BookingStep } from "@/contexts/SchedulingContext";
import { Calendar } from "./Calendar";
import { TimeSlots } from "./TimeSlots";
import { SessionDurationSelector } from "./SessionDurationSelector";
import { BookingForm } from "./BookingForm";
import { ConfirmationStep } from "./ConfirmationStep";
import { useAvailabilityData } from "@/hooks/useAvailabilityData";
import { Tutor } from "@/types/tutor";
import { Loader2 } from "lucide-react";

interface SchedulerContentProps {
  onClose: () => void;
}

function SchedulerContent({ onClose }: SchedulerContentProps) {
  const { state, dispatch, tutor, continueToNextStep, goToPreviousStep } = useScheduling();
  const { bookingStep } = state;
  
  const startDate = new Date();
  const { loading, availableSlots, hasAvailability, errorMessage } = 
    useAvailabilityData(tutor!, startDate);
  
  const handleReset = () => {
    dispatch({ type: 'RESET' });
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal mr-2" />
        <p>Loading availability...</p>
      </div>
    );
  }
  
  if (!hasAvailability) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">
          {errorMessage || "No availability found for this tutor."}
        </p>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }
  
  // Get available dates from the slots
  const availableDates = Array.from(
    new Set(
      availableSlots
        .filter(slot => slot.available)
        .map(slot => new Date(slot.day.setHours(0, 0, 0, 0)))
    )
  );
  
  return (
    <div className="p-4">
      {bookingStep === BookingStep.SELECT_DATE_TIME && (
        <>
          <Calendar availableDates={availableDates} />
          <TimeSlots availableSlots={availableSlots} />
          
          {state.selectedDate && state.selectedTimeSlot && (
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={continueToNextStep}
                className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
              >
                Continue
              </Button>
            </div>
          )}
        </>
      )}
      
      {bookingStep === BookingStep.SELECT_DURATION && (
        <>
          <SessionDurationSelector />
          
          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={goToPreviousStep}>
              Back
            </Button>
            <Button 
              onClick={continueToNextStep}
              className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
            >
              Continue
            </Button>
          </div>
        </>
      )}
      
      {bookingStep === BookingStep.FILL_FORM && (
        <>
          <BookingForm />
          
          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={goToPreviousStep}>
              Back
            </Button>
            <Button 
              onClick={continueToNextStep}
              className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
            >
              Complete Booking
            </Button>
          </div>
        </>
      )}
      
      {bookingStep === BookingStep.CONFIRMATION && (
        <ConfirmationStep onClose={onClose} onReset={handleReset} />
      )}
    </div>
  );
}

interface NewSchedulerProps {
  tutor: Tutor;
  isOpen: boolean;
  onClose: () => void;
}

export function NewScheduler({ tutor, isOpen, onClose }: NewSchedulerProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogTitle>Book a Session with {tutor.name}</DialogTitle>
        <SchedulingProvider>
          <SchedulerProviderInitializer tutor={tutor}>
            <SchedulerContent onClose={onClose} />
          </SchedulerProviderInitializer>
        </SchedulingProvider>
      </DialogContent>
    </Dialog>
  );
}

// Helper component to initialize the SchedulingProvider with the tutor
interface SchedulerProviderInitializerProps {
  tutor: Tutor;
  children: React.ReactNode;
}

function SchedulerProviderInitializer({ tutor, children }: SchedulerProviderInitializerProps) {
  const { setTutor } = useScheduling();
  
  React.useEffect(() => {
    setTutor(tutor);
  }, [tutor, setTutor]);
  
  return <>{children}</>;
}
