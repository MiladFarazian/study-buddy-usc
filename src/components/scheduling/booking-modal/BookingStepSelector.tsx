
import { useState, useEffect } from "react";
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling/types";
import { DateSelector } from "./date-selector/DateSelector";
import { DurationSelector } from "./duration/DurationSelector";
import { CourseSelector } from "./course/CourseSelector";
import { SessionTypeSelector } from "./session-type/SessionTypeSelector";
import { BookingStep, useScheduling, SessionType } from "@/contexts/SchedulingContext";
import { LoadingState } from "./LoadingState";
import { SlotSelectionFooter } from "./SlotSelectionFooter";
import { useAvailabilityData } from "@/hooks/useAvailabilityData";
import { startOfDay } from "date-fns";
import { useTutorCourses } from "@/hooks/useTutorCourses";
import { Course } from "@/types/CourseTypes";

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
  
  // Get tutor courses for the CourseSelector
  const { courses, loading: coursesLoading } = useTutorCourses(tutor.id);
  
  // Get availability data for date selection
  const today = startOfDay(new Date());
  const { availableSlots, loading: availabilityLoading } = 
    useAvailabilityData(tutor, today);
  
  // Set the tutor in the scheduling context
  useEffect(() => {
    setTutor(tutor);
  }, [tutor, setTutor]);
  
  // Calculate duration options based on tutor's rate
  const durationOptions = [
    { minutes: 30, cost: (tutor.hourlyRate || 25) / 2 },
    { minutes: 60, cost: tutor.hourlyRate || 25 },
    { minutes: 90, cost: (tutor.hourlyRate || 25) * 1.5 },
    { minutes: 120, cost: (tutor.hourlyRate || 25) * 2 }
  ];
  
  // Calculate consecutive slots from available slots
  const calculateConsecutiveSlots = (selectedSlot: BookingSlot): BookingSlot[] => {
    if (!availableSlots.length) return [];
    
    const selectedDate = selectedSlot.day instanceof Date ? 
      selectedSlot.day.toDateString() : 
      new Date(selectedSlot.day).toDateString();
    
    // Get all slots for the same day
    const daySlots = availableSlots.filter(slot => {
      const slotDate = slot.day instanceof Date ? 
        slot.day.toDateString() : 
        new Date(slot.day).toDateString();
      return slotDate === selectedDate && slot.available;
    });
    
    // Sort slots by start time
    const sortedSlots = daySlots.sort((a, b) => {
      const aMinutes = convertTimeToMinutes(a.start);
      const bMinutes = convertTimeToMinutes(b.start);
      return aMinutes - bMinutes;
    });
    
    // Find consecutive slots starting from selected slot
    const selectedStartMinutes = convertTimeToMinutes(selectedSlot.start);
    const consecutiveSlots: BookingSlot[] = [];
    
    for (const slot of sortedSlots) {
      const slotStartMinutes = convertTimeToMinutes(slot.start);
      if (slotStartMinutes >= selectedStartMinutes) {
        // Check if this slot is consecutive with the previous one
        if (consecutiveSlots.length === 0 || 
            slotStartMinutes === convertTimeToMinutes(consecutiveSlots[consecutiveSlots.length - 1].end)) {
          consecutiveSlots.push(slot);
        } else {
          break; // Gap found, stop looking
        }
      }
    }
    
    return consecutiveSlots;
  };
  
  // Helper function to convert time string to minutes
  const convertTimeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  // Render the current step
  const renderStep = () => {
    if (loading) {
      return <LoadingState message="Loading..." />;
    }
    
    switch (state.bookingStep) {
      case BookingStep.SELECT_DATE_TIME:
        return (
          <DateSelector 
            date={state.selectedDate} 
            onDateChange={(date) => dispatch({ type: 'SELECT_DATE', payload: date })}
            availableSlots={availableSlots}
            isLoading={availabilityLoading}
          />
        );
      case BookingStep.SELECT_DURATION:
        return (
          <DurationSelector 
            selectedSlot={state.selectedTimeSlot!}
            durationOptions={durationOptions}
            selectedDuration={state.selectedDuration}
            onSelectDuration={(duration) => dispatch({ type: 'SET_DURATION', payload: duration })}
            onBack={() => dispatch({ type: 'SET_STEP', payload: BookingStep.SELECT_DATE_TIME })}
            onContinue={() => dispatch({ type: 'SET_STEP', payload: BookingStep.SELECT_COURSE })}
            hourlyRate={tutor.hourlyRate || 25}
            consecutiveSlots={calculateConsecutiveSlots(state.selectedTimeSlot!)}
            selectedCourseId={state.selectedCourseId}
            courses={courses as Course[]}
          />
        );
      case BookingStep.SELECT_COURSE:
        return (
          <CourseSelector
            selectedCourseId={state.selectedCourseId}
            onCourseSelect={(courseId) => dispatch({ type: 'SET_COURSE', payload: courseId })}
            onBack={() => dispatch({ type: 'SET_STEP', payload: BookingStep.SELECT_DURATION })}
            loading={coursesLoading}
            courses={courses as Course[]}
            tutor={tutor}
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
        return (
          <DateSelector 
            date={state.selectedDate} 
            onDateChange={(date) => dispatch({ type: 'SELECT_DATE', payload: date })}
            availableSlots={availableSlots}
            isLoading={availabilityLoading}
          />
        );
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
