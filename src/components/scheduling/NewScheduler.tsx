
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tutor } from "@/types/tutor";
import { useAvailabilityData } from "@/hooks/useAvailabilityData";
import { SchedulingProvider, useScheduling } from "@/contexts/SchedulingContext";
import { DateSelectionStep } from "./DateSelectionStep";
import { TimeSlotSelectionStep } from "./TimeSlotSelectionStep";
import { SessionDetailsStep } from "./SessionDetailsStep";
import { PaymentStep } from "./PaymentStep";
import { ConfirmationStep } from "./ConfirmationStep";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthRequiredDialog } from "./booking-modal/AuthRequiredDialog";

interface BookingContentProps {
  loading: boolean;
  availableSlots: any[];
  hasAvailability: boolean;
  errorMessage: string | null;
  authRequired: boolean;
  setAuthRequired: (value: boolean) => void;
  handleComplete: () => void;
  handleClose: () => void;
  tutor: Tutor;
}

// Inner content component that uses the scheduling context
function BookingContent({
  loading, 
  availableSlots, 
  hasAvailability, 
  errorMessage,
  authRequired,
  setAuthRequired,
  handleComplete,
  handleClose,
  tutor
}: BookingContentProps) {
  const { state, setTutor } = useScheduling();
  
  // Set the tutor in the context when the component mounts
  useEffect(() => {
    setTutor(tutor);
  }, [tutor, setTutor]);
  
  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal mb-4" />
        <p className="text-muted-foreground">Loading availability...</p>
      </div>
    );
  }
  
  if (!hasAvailability) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center px-4">
        <AlertCircle className="h-8 w-8 text-yellow-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Availability</h3>
        <p className="text-muted-foreground mb-4">
          {errorMessage || "This tutor hasn't set their availability yet."}
        </p>
        <Button onClick={handleClose} variant="outline">Close</Button>
      </div>
    );
  }
  
  return (
    <>
      {state.bookingStep === 'date' && (
        <DateSelectionStep availableSlots={availableSlots} isLoading={loading} />
      )}
      
      {state.bookingStep === 'time' && (
        <TimeSlotSelectionStep availableSlots={availableSlots} isLoading={loading} />
      )}
      
      {state.bookingStep === 'details' && (
        <SessionDetailsStep />
      )}
      
      {state.bookingStep === 'payment' && (
        <PaymentStep onComplete={handleComplete} onRequireAuth={() => setAuthRequired(true)} />
      )}
      
      {state.bookingStep === 'confirmation' && (
        <ConfirmationStep onClose={handleClose} />
      )}
      
      <AuthRequiredDialog 
        isOpen={authRequired} 
        onClose={() => setAuthRequired(false)} 
      />
    </>
  );
}

interface NewSchedulerProps {
  tutor: Tutor;
  isOpen: boolean;
  onClose: () => void;
}

export function NewScheduler({ tutor, isOpen, onClose }: NewSchedulerProps) {
  const [authRequired, setAuthRequired] = useState(false);
  const { loading, availableSlots, hasAvailability, errorMessage } = useAvailabilityData(tutor, new Date());
  
  const handleComplete = () => {
    // Any completion logic can go here
  };
  
  return (
    <SchedulingProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Book a Session with {tutor.firstName || tutor.name.split(' ')[0]}</DialogTitle>
          </DialogHeader>
          
          <div className="p-6 pt-2">
            <BookingContent 
              tutor={tutor}
              loading={loading}
              availableSlots={availableSlots}
              hasAvailability={hasAvailability}
              errorMessage={errorMessage}
              authRequired={authRequired}
              setAuthRequired={setAuthRequired}
              handleComplete={handleComplete}
              handleClose={onClose}
            />
          </div>
        </DialogContent>
      </Dialog>
    </SchedulingProvider>
  );
}
