
import { useState } from "react";
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling/types";
import { DateSelector } from "./date-selector/DateSelector";
import { DurationSelector } from "./duration/DurationSelector";
import { CourseSelector } from "./course/CourseSelector";
import { SessionTypeSelector } from "./session-type/SessionTypeSelector";
import { BookingStep, useScheduling } from "@/contexts/SchedulingContext";
import { LoadingState } from "./LoadingState";
import { SlotSelectionFooter } from "./SlotSelectionFooter";

interface BookingStepSelectorProps {
  tutor: Tutor;
  onSelectSlot: (slot: BookingSlot, duration: number, courseId: string | null) => void;
  onClose: () => void;
  disabled?: boolean;
}

export function BookingStepSelector({
  tutor,
  onSelectSlot,
  onClose,
  disabled = false,
}: BookingStepSelectorProps) {
  const { state, dispatch, setTutor } = useScheduling();
  const [loading, setLoading] = useState(false);
  
  // Set the tutor in the scheduling context
  useState(() => {
    setTutor(tutor);
  });
  
  // Render the current step
  const renderStep = () => {
    if (loading) {
      return <LoadingState />;
    }
    
    switch (state.bookingStep) {
      case BookingStep.SELECT_DATE_TIME:
        return <DateSelector />;
      case BookingStep.SELECT_DURATION:
        return (
          <DurationSelector 
            onBack={() => dispatch({ type: 'SET_STEP', payload: BookingStep.SELECT_DATE_TIME })}
            onContinue={() => dispatch({ type: 'SET_STEP', payload: BookingStep.SELECT_COURSE })}
          />
        );
      case BookingStep.SELECT_COURSE:
        return (
          <CourseSelector
            tutorId={tutor.id}
            onBack={() => dispatch({ type: 'SET_STEP', payload: BookingStep.SELECT_DURATION })}
            onContinue={() => dispatch({ type: 'SET_STEP', payload: BookingStep.SELECT_SESSION_TYPE })}
          />
        );
      case BookingStep.SELECT_SESSION_TYPE:
        return (
          <SessionTypeSelector
            onBack={() => dispatch({ type: 'SET_STEP', payload: BookingStep.SELECT_COURSE })}
            onContinue={handleBookSession}
          />
        );
      default:
        return <DateSelector />;
    }
  };
  
  // Handle booking session
  const handleBookSession = () => {
    setLoading(true);
    
    if (state.selectedTimeSlot && state.selectedDuration) {
      console.log("[BookingStepSelector] Creating session with:", {
        slot: state.selectedTimeSlot,
        duration: state.selectedDuration,
        courseId: state.selectedCourseId,
        sessionType: state.sessionType
      });
      
      // Pass the booking information to parent component
      onSelectSlot(
        state.selectedTimeSlot, 
        state.selectedDuration, 
        state.selectedCourseId
      );
    }
  };
  
  // Render footer for date selection step
  const renderFooter = () => {
    if (state.bookingStep === BookingStep.SELECT_DATE_TIME) {
      return (
        <SlotSelectionFooter 
          onClose={onClose} 
          onContinue={() => dispatch({ type: 'SET_STEP', payload: BookingStep.SELECT_DURATION })}
          disableContinue={!state.selectedTimeSlot || !state.selectedDate}
          disabled={disabled}
        />
      );
    }
    
    return null;
  };
  
  return (
    <div>
      {renderStep()}
      {renderFooter()}
    </div>
  );
}
