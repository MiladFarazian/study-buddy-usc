
import React, { useState, useEffect } from "react";
import { useScheduling, BookingStep } from "@/contexts/SchedulingContext";
import { DateSelectionStep } from "./DateSelectionStep";
import { SessionDurationSelector } from "./SessionDurationSelector";
import { PaymentStep } from "./PaymentStep";
import { ConfirmationStep } from "./ConfirmationStep";
import { BookingSlot } from "@/lib/scheduling";
import { startOfDay } from "date-fns";
import { Loader2 } from "lucide-react";
import { Tutor } from "@/types/tutor";
import { useAvailabilityData } from "@/hooks/useAvailabilityData";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CalendlyBookingWizardProps {
  tutor: Tutor;
  onClose: () => void;
}

export function CalendlyBookingWizard({ tutor, onClose }: CalendlyBookingWizardProps) {
  const { state, dispatch, setTutor } = useScheduling();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const { session, user } = useAuth();
  
  // Get availability data for the tutor
  const today = startOfDay(new Date());
  const { loading: isLoading, availableSlots, hasAvailability, errorMessage } = 
    useAvailabilityData(tutor, today);
  
  // Set the tutor in the scheduling context
  useEffect(() => {
    if (tutor) {
      setTutor(tutor);
    }
    
    // Short delay to ensure auth state is processed
    const timer = setTimeout(() => {
      setInitializing(false);
    }, 800);
    
    // Reset the scheduling state when the component unmounts
    return () => {
      clearTimeout(timer);
      dispatch({ type: "RESET" });
    };
  }, [tutor, setTutor, dispatch]);
  
  const renderStep = () => {
    // Don't render anything until initialization is complete
    if (initializing) {
      return (
        <div className="flex flex-col justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal mb-4" />
          <p className="text-center text-gray-600">Initializing booking wizard...</p>
        </div>
      );
    }
    
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
  
  // Show loading state if the initialization is not complete
  if (initializing || (isLoading && !availableSlots.length)) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4">
        <div className="flex flex-col justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal mb-4" />
          <p className="text-center text-gray-600">Loading available times...</p>
        </div>
      </div>
    );
  }
  
  // Show error message if there's no availability
  if (!hasAvailability && !isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4">
        <div className="flex flex-col justify-center items-center py-8">
          <div className="mb-4 p-2 rounded-full bg-red-50">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-usc-cardinal"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h3 className="text-lg font-medium mb-2">No Availability</h3>
          <p className="text-center text-gray-600 mb-4">{errorMessage || "This tutor has no available time slots."}</p>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-usc-cardinal text-white rounded-md hover:bg-usc-cardinal-dark"
          >
            Close
          </button>
        </div>
      </div>
    );
  }
  
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
