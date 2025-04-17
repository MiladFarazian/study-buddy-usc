
import React from 'react';
import { CalendlyDateSelector } from "../../CalendlyDateSelector";
import { CalendlyTimeSlots } from "../../CalendlyTimeSlots";
import { DurationSelector } from "../duration/DurationSelector";
import { ConfirmationStep } from "../ConfirmationStep";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { BookingStep } from "../hooks/useBookingSteps";
import { BookingSlot } from "@/lib/scheduling/types";
import { Tutor } from "@/types/tutor";

interface BookingStepsProps {
  step: BookingStep;
  tutor: Tutor;
  selectedSlot: BookingSlot | null;
  selectedDuration: number;
  availableSlots: BookingSlot[];
  availableDates: Date[];
  onSelectTimeSlot: (slot: BookingSlot) => void;
  onSelectDuration: (duration: number) => void;
  onContinue: () => void;
  onBack: () => void;
  onClose: () => void;
  isBooking: boolean;
  onConfirm: () => void;
}

export function BookingSteps({
  step,
  tutor,
  selectedSlot,
  selectedDuration,
  availableSlots,
  availableDates,
  onSelectTimeSlot,
  onSelectDuration,
  onContinue,
  onBack,
  onClose,
  isBooking,
  onConfirm
}: BookingStepsProps) {
  const renderStep = () => {
    switch (step) {
      case "select-date-time":
        return (
          <>
            <Card className="p-6 mb-8">
              <CalendlyDateSelector availableDates={availableDates} />
            </Card>
            
            <Card className="p-6 mb-8">
              <CalendlyTimeSlots availableSlots={availableSlots} />
            </Card>
          </>
        );
      
      case "select-duration":
        return selectedSlot ? (
          <DurationSelector
            selectedSlot={selectedSlot}
            durationOptions={[
              { minutes: 30, cost: (tutor.hourlyRate || 60) / 2 },
              { minutes: 60, cost: tutor.hourlyRate || 60 },
              { minutes: 90, cost: (tutor.hourlyRate || 60) * 1.5 }
            ]}
            selectedDuration={selectedDuration}
            onSelectDuration={onSelectDuration}
            onBack={onBack}
            onContinue={onContinue}
            hourlyRate={tutor.hourlyRate || 60}
          />
        ) : (
          <Alert>
            <AlertDescription>Please select a time slot first.</AlertDescription>
          </Alert>
        );
      
      case "confirm":
      case "complete":
        return selectedSlot ? (
          <ConfirmationStep
            tutor={tutor}
            selectedSlot={selectedSlot}
            selectedDuration={selectedDuration}
            onClose={onClose}
          />
        ) : null;
      
      default:
        return null;
    }
  };

  return <div className="space-y-6">{renderStep()}</div>;
}
