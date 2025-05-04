
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tutor } from "@/types/tutor";
import { useBookSessionModal } from "./hooks/useBookSessionModal";
import { ModalContent } from "./ModalContent";

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
  const {
    selectedDate,
    state,
    loading,
    availableSlots,
    hasAvailability,
    errorMessage,
    refreshAvailability,
    handleDateChange,
    handleSelectSlot,
    handleClose,
    handleContinue,
    handleBack,
    handleBookingComplete,
    getStepTitle
  } = useBookSessionModal(tutor, isOpen, onClose, initialDate, initialTime);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <ModalContent 
            step={state.bookingStep}
            loading={loading}
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
            onComplete={handleBookingComplete}
            sessionTimeRange={state.selectedTimeSlot ? {
              start: state.selectedTimeSlot.start,
              end: state.selectedTimeSlot.end
            } : undefined}
            selectedDuration={state.selectedDuration}
            onDurationChange={(duration) => {
              // Update the duration in the state
              setState(prev => ({ ...prev, selectedDuration: duration }));
            }}
            calculatedCost={state.selectedTimeSlot && tutor.hourlyRate ? 
              (tutor.hourlyRate / 60) * state.selectedDuration : undefined}
            tutor={tutor}  // Pass the tutor prop to ModalContent
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
