
import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tutor } from "@/types/tutor";
import { useBookSessionModal } from "./hooks/useBookSessionModal";
import { ModalContent } from "./ModalContent";
import { useScheduling, SchedulingProvider, BookingStep } from "@/contexts/SchedulingContext";

export interface BookSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutor: Tutor;
  initialDate?: Date;
  initialTime?: string;
}

// This component ensures we have the SchedulingProvider
function BookSessionModalContent({
  isOpen,
  onClose,
  tutor,
  initialDate,
  initialTime
}: BookSessionModalProps) {
  const { setTutor } = useScheduling();
  
  // Initialize the tutor and other data in the SchedulingContext when modal opens
  useEffect(() => {
    if (isOpen && tutor) {
      // Set tutor in context when modal opens
      setTutor(tutor);
    }
  }, [isOpen, tutor, setTutor]);
  
  const {
    selectedDate,
    state,
    loading,
    bookingInProgress,
    isConfirmed,
    availableSlots,
    hasAvailability,
    errorMessage,
    refreshAvailability,
    handleDateChange,
    handleSelectSlot,
    handleDurationChange,
    handleCourseChange,
    handleClose,
    handleContinue,
    handleBack,
    handleBookingComplete,
    handlePaymentComplete,
    getStepTitle
  } = useBookSessionModal(tutor, isOpen, onClose, initialDate, initialTime);

  // Debug the selected date and time slot
  useEffect(() => {
    console.log("BookSessionModal - Selected Date:", selectedDate);
    console.log("BookSessionModal - Selected Time Slot:", state.selectedTimeSlot);
    console.log("BookSessionModal - Selected Course:", state.selectedCourseId);
  }, [selectedDate, state.selectedTimeSlot, state.selectedCourseId]);

  if (!isOpen) return null;

  // Conditional close handler - prevent auto-close during confirmation
  const handleDialogChange = (open: boolean) => {
    // If trying to close and we're in confirmation step with confirmed booking, prevent it
    if (!open && state.bookingStep === BookingStep.CONFIRMATION && isConfirmed) {
      return; // Don't allow auto-close during confirmation
    }
    // Otherwise, allow normal close behavior
    if (!open) {
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <ModalContent 
            step={state.bookingStep}
            loading={loading}
            bookingInProgress={bookingInProgress}
            isConfirmed={isConfirmed}
            hasAvailability={hasAvailability}
            errorMessage={errorMessage}
            refreshAvailability={refreshAvailability}
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            availableSlots={availableSlots}
            selectedSlot={state.selectedTimeSlot}
            onSelectSlot={handleSelectSlot}
            onBack={handleBack}
            onContinue={handleContinue}
            onComplete={handleClose}
            onPaymentComplete={handlePaymentComplete}
            sessionTimeRange={state.selectedTimeSlot ? {
              start: state.selectedTimeSlot.start,
              end: state.selectedTimeSlot.end
            } : undefined}
            selectedDuration={state.selectedDuration}
            onDurationChange={handleDurationChange}
            calculatedCost={state.selectedTimeSlot && tutor.hourlyRate ? 
              (tutor.hourlyRate / 60) * state.selectedDuration : undefined}
            tutor={tutor}
            selectedCourseId={state.selectedCourseId}
            onCourseSelect={handleCourseChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export the wrapped component with the SchedulingProvider
export function BookSessionModal(props: BookSessionModalProps) {
  return (
    <SchedulingProvider>
      <BookSessionModalContent {...props} />
    </SchedulingProvider>
  );
}
