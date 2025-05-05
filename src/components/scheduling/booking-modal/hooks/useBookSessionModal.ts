
import { useState, useEffect, useCallback } from "react";
import { addDays, startOfDay } from "date-fns";
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling/types";
import { toast } from "sonner";
import { BookingStep, useScheduling, SessionType } from "@/contexts/SchedulingContext";
import { useAvailabilityData } from "@/hooks/useAvailabilityData";
import { createSessionBooking } from "@/lib/scheduling/booking-utils";
import { supabase } from "@/integrations/supabase/client";

interface BookingState {
  bookingStep: BookingStep; 
  selectedTimeSlot: BookingSlot | null;
  selectedDuration: number;
  selectedCourseId: string | null;
}

export function useBookSessionModal(
  tutor: Tutor, 
  isOpen: boolean, 
  onClose: () => void,
  initialDate?: Date,
  initialTime?: string
) {
  // State for the booking flow
  const [state, setState] = useState<BookingState>({
    bookingStep: BookingStep.SELECT_DATE_TIME,
    selectedTimeSlot: null,
    selectedDuration: 60, // Default to 1 hour
    selectedCourseId: null
  });
  
  // Get access to the SchedulingContext
  const { dispatch, setCourse, setTutor, state: contextState, sessionType, location } = useScheduling();
  
  // State for selected date
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (initialDate) return startOfDay(initialDate);
    return startOfDay(new Date());
  });

  // Ensure we set the tutor in context
  useEffect(() => {
    if (isOpen && tutor) {
      setTutor(tutor);
    }
  }, [isOpen, tutor, setTutor]);
  
  // If the modal is closed, reset state
  useEffect(() => {
    if (!isOpen) {
      setState({
        bookingStep: BookingStep.SELECT_DATE_TIME,
        selectedTimeSlot: null,
        selectedDuration: 60,
        selectedCourseId: null
      });
      
      // Also reset the course in the scheduling context
      setCourse(null);
    }
  }, [isOpen, setCourse]);

  // Sync selected date with SchedulingContext
  useEffect(() => {
    if (selectedDate) {
      dispatch({ type: 'SELECT_DATE', payload: selectedDate });
    }
  }, [selectedDate, dispatch]);

  // Sync selected time slot with SchedulingContext
  useEffect(() => {
    if (state.selectedTimeSlot) {
      dispatch({ type: 'SELECT_TIME_SLOT', payload: state.selectedTimeSlot });
    }
  }, [state.selectedTimeSlot, dispatch]);

  // Sync selected duration with SchedulingContext
  useEffect(() => {
    if (state.selectedDuration) {
      dispatch({ type: 'SET_DURATION', payload: state.selectedDuration });
    }
  }, [state.selectedDuration, dispatch]);
  
  // Get available slots for the selected date
  const { availableSlots, loading, errorMessage, refreshAvailability } = 
    useAvailabilityData(tutor, selectedDate);
  
  // Check if there's any availability
  const hasAvailability = availableSlots.length > 0;
  
  // Handle date change
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setState(prev => ({ ...prev, selectedTimeSlot: null }));
    dispatch({ type: 'SELECT_DATE', payload: date });
  };
  
  // Handle slot selection
  const handleSelectSlot = (slot: BookingSlot) => {
    // Ensure the slot has tutorId
    const completeSlot: BookingSlot = {
      ...slot,
      tutorId: tutor.id
    };
    
    setState(prev => ({ ...prev, selectedTimeSlot: completeSlot }));
    dispatch({ type: 'SELECT_TIME_SLOT', payload: completeSlot });
  };
  
  // Handle duration change
  const handleDurationChange = (duration: number) => {
    setState(prev => ({ ...prev, selectedDuration: duration }));
    dispatch({ type: 'SET_DURATION', payload: duration });
  };
  
  // Handle course selection
  const handleCourseChange = (courseId: string | null) => {
    console.log("Course selection in useBookSessionModal:", courseId);
    setState(prev => ({ ...prev, selectedCourseId: courseId }));
    // Also update the course in the scheduling context
    setCourse(courseId);
  };
  
  // Handle when user continues to next step
  const handleContinue = () => {
    if (state.bookingStep === BookingStep.SELECT_DATE_TIME && !state.selectedTimeSlot) {
      toast.error("Please select a time slot before continuing");
      return;
    }
    
    const nextStep = state.bookingStep + 1 as BookingStep;
    setState(prev => ({ ...prev, bookingStep: nextStep }));
    dispatch({ type: 'SET_STEP', payload: nextStep });
  };
  
  // Handle when user goes back to previous step
  const handleBack = () => {
    const prevStep = Math.max(0, state.bookingStep - 1) as BookingStep;
    setState(prev => ({ ...prev, bookingStep: prevStep }));
    dispatch({ type: 'SET_STEP', payload: prevStep });
  };
  
  // Handle closing the modal
  const handleClose = () => {
    onClose();
  };
  
  // Get the title for the current step
  const getStepTitle = (): string => {
    switch (state.bookingStep) {
      case BookingStep.SELECT_DATE_TIME:
        return "Select Date & Time";
      case BookingStep.SELECT_DURATION:
        return "Select Duration";
      case BookingStep.SELECT_COURSE:
        return "Select Course";
      case BookingStep.SELECT_SESSION_TYPE:
        return "Select Session Type";
      case BookingStep.FILL_FORM:
        return "Student Information";
      case BookingStep.CONFIRMATION:
        return "Confirm Booking";
      default:
        return "Book a Session";
    }
  };
  
  // Handle booking completion
  const handleBookingComplete = useCallback(async () => {
    console.log("Booking completed!");
    
    if (!state.selectedTimeSlot) {
      toast.error("No time slot selected. Please try again.");
      return;
    }
    
    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("You must be logged in to book a session");
      return;
    }
    
    try {
      // Calculate start and end times based on the selected slot and duration
      const startTime = new Date(selectedDate);
      const [startHour, startMinute] = state.selectedTimeSlot.start.split(':').map(Number);
      startTime.setHours(startHour, startMinute, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + state.selectedDuration);
      
      // Get session type and location from context
      const sessionTypeValue = contextState.sessionType;
      const locationValue = contextState.location;
      
      console.log("Creating session with:", {
        userId: user.id,
        tutorId: tutor.id,
        courseId: state.selectedCourseId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        location: locationValue,
        sessionType: sessionTypeValue
      });
      
      // Actually create the session in the database
      const sessionDetails = await createSessionBooking(
        user.id,
        tutor.id,
        state.selectedCourseId,
        startTime.toISOString(),
        endTime.toISOString(),
        locationValue,
        null,  // notes
        sessionTypeValue
      );
      
      if (sessionDetails) {
        toast.success("Your session has been booked!");
        console.log("Session created:", sessionDetails);
      } else {
        toast.error("Failed to book session. Please try again.");
        return;
      }
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("An error occurred while booking your session");
      return;
    }
    
    onClose();
  }, [onClose, tutor, selectedDate, state, contextState]);

  return {
    selectedDate,
    state,
    loading,
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
    getStepTitle
  };
}
