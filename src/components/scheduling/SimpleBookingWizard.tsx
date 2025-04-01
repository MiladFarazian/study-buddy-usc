
import React, { useState, useEffect } from "react";
import { DateSelectionStep } from "./DateSelectionStep";
import { SessionDurationSelector } from "./SessionDurationSelector";
import { PaymentStep } from "./PaymentStep";
import { ConfirmationStep } from "./ConfirmationStep";
import { useScheduling, BookingStep } from "@/contexts/SchedulingContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookingSlot } from "@/lib/scheduling";
import { startOfDay } from "date-fns";
import { useAvailabilityData } from "@/hooks/useAvailabilityData";

interface SimpleBookingWizardProps {
  tutor: any;
  onClose: () => void;
}

export function SimpleBookingWizard({ tutor, onClose }: SimpleBookingWizardProps) {
  const { state, dispatch, setTutor } = useScheduling();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  
  // Get availability data for the tutor
  const today = startOfDay(new Date());
  const { loading: isLoading, availableSlots } = 
    tutor ? useAvailabilityData(tutor, today) : { loading: false, availableSlots: [] };
  
  // Set the tutor in the scheduling context
  useEffect(() => {
    if (tutor) {
      setTutor(tutor);
    }
    
    // Reset the scheduling state when the component unmounts
    return () => {
      dispatch({ type: "RESET" });
    };
  }, [tutor, setTutor, dispatch]);
  
  const renderStep = () => {
    switch (state.bookingStep) {
      case BookingStep.SELECT_DATE_TIME:
        return <DateSelectionStep availableSlots={availableSlots} isLoading={isLoading} />;
      case BookingStep.SELECT_DURATION:
        return <SessionDurationSelector />;
      case BookingStep.FILL_FORM:
        return (
          <PaymentStep 
            onComplete={() => dispatch({ type: "SET_STEP", payload: BookingStep.CONFIRMATION })}
            onRequireAuth={() => setShowAuthDialog(true)}
          />
        );
      case BookingStep.CONFIRMATION:
        return (
          <ConfirmationStep
            onClose={onClose}
            onReset={() => dispatch({ type: "RESET" })}
          />
        );
      default:
        return <DateSelectionStep availableSlots={availableSlots} isLoading={isLoading} />;
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {renderStep()}
      
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Authentication Required</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              You need to be logged in to book a session. Please log in or create an account to continue.
            </p>
            {/* Auth buttons would go here */}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
