
import React from 'react';
import { BookingStep } from "@/contexts/SchedulingContext";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateTimeStep } from "./DateTimeStep";
import { SessionDurationSelector } from "./duration/SessionDurationSelector";
import { CourseSelector } from "./course/CourseSelector";
import { SessionTypeSelector } from "./session-type/SessionTypeSelector";
import { StudentInfoForm } from "./student-info/StudentInfoForm";
import { PaymentStep } from "./PaymentStep";
import { ConfirmationStep } from "./ConfirmationStep";
import { BookingSlot } from "@/lib/scheduling/types";
import { WeeklyAvailability } from "@/lib/scheduling/types/availability";
import { Tutor } from "@/types/tutor";

interface ModalContentProps {
  step: BookingStep;
  loading: boolean;
  bookingInProgress: boolean;
  isConfirmed: boolean;
  hasAvailability: boolean;
  errorMessage?: string;
  refreshAvailability: () => void;
  selectedDate?: Date;
  onDateChange: (date: Date) => void;
  availableSlots: BookingSlot[];
  selectedSlot: BookingSlot | null;
  onSelectSlot: (slot: BookingSlot) => void;
  onBack: () => void;
  onContinue: () => void;
  onComplete: () => void;
  onPaymentComplete: (sessionId: string, paymentSuccess: boolean) => void;
  sessionTimeRange?: { start: string; end: string };
  selectedDuration: number;
  onDurationChange: (duration: number) => void;
  calculatedCost?: number;
  tutor: Tutor;
  selectedCourseId: string | null;
  onCourseSelect: (courseId: string | null) => void;
  tutorAvailability: WeeklyAvailability | null;
}

export function ModalContent({
  step,
  loading,
  bookingInProgress,
  isConfirmed,
  hasAvailability,
  errorMessage,
  refreshAvailability,
  selectedDate,
  onDateChange,
  availableSlots,
  selectedSlot,
  onSelectSlot,
  onBack,
  onContinue,
  onComplete,
  onPaymentComplete,
  sessionTimeRange,
  selectedDuration,
  onDurationChange,
  calculatedCost,
  tutor,
  selectedCourseId,
  onCourseSelect,
  tutorAvailability
}: ModalContentProps) {
  // Add debugging log for Phase 1 & 2 testing
  console.log("🔍 ModalContent - TutorAvailability data:", tutorAvailability);
  console.log("🔍 ModalContent - Selected date:", selectedDate);
  console.log("🔍 ModalContent - Selected slot:", selectedSlot);
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal mr-2" />
        <p>Loading available times...</p>
      </div>
    );
  }

  if (!hasAvailability) {
    return (
      <div className="text-center py-8">
        <p className="text-lg font-medium mb-2">No Availability Found</p>
        <p className="text-muted-foreground mb-4">
          {errorMessage || "This tutor hasn't set their availability yet."}
        </p>
        <Button 
          variant="outline" 
          onClick={refreshAvailability}
          className="mx-auto"
        >
          Retry
        </Button>
      </div>
    );
  }

  switch (step) {
    case BookingStep.SELECT_DATE_TIME:
      return (
        <DateTimeStep
          selectedDate={selectedDate}
          onDateChange={onDateChange}
          availableSlots={availableSlots}
          selectedSlot={selectedSlot}
          onSelectSlot={onSelectSlot}
          onContinue={onContinue}
          isLoading={loading}
        />
      );
      
     case BookingStep.SELECT_DURATION:
      return (
        <SessionDurationSelector
          selectedDuration={selectedDuration}
          onDurationChange={onDurationChange}
          sessionTimeRange={sessionTimeRange}
          calculatedCost={calculatedCost}
          onBack={onBack}
          onContinue={onContinue}
          tutorAvailability={tutorAvailability}
          selectedDate={selectedDate}
          selectedSlot={selectedSlot}
        />
      );
      
    case BookingStep.SELECT_COURSE:
      return (
        <CourseSelector 
          selectedCourseId={selectedCourseId} 
          onCourseSelect={onCourseSelect}
          onBack={onBack}
          onContinue={onContinue}
          tutor={tutor}
        />
      );
      
    case BookingStep.SELECT_SESSION_TYPE:
      return (
        <SessionTypeSelector 
          onBack={onBack}
          onContinue={onContinue}
        />
      );
      
    case BookingStep.FILL_FORM:
      return (
        <StudentInfoForm 
          onBack={onBack}
          onContinue={onContinue}
        />
      );
      
    case BookingStep.PAYMENT:
      return (
        <PaymentStep 
          onBack={onBack}
          onContinue={onPaymentComplete}
          calculatedCost={calculatedCost}
          tutor={tutor}
        />
      );
      
    case BookingStep.CONFIRMATION:
      return (
        <>
          <ConfirmationStep />
          
          <div className="flex justify-end mt-6 pt-4 border-t">
            <Button 
              className="bg-usc-cardinal hover:bg-usc-cardinal-dark"
              onClick={onComplete}
              disabled={bookingInProgress && !isConfirmed}
            >
              {bookingInProgress && !isConfirmed ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finalizing...
                </>
              ) : (
                "Close"
              )}
            </Button>
          </div>
        </>
      );
      
    default:
      return <div>Unknown step</div>;
  }
}
