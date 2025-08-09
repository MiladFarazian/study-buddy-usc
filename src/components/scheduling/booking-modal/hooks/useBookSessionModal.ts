
import { useState, useEffect, useCallback } from "react";
import { addDays, startOfDay } from "date-fns";
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling/types";
import { toast } from "sonner";
import { BookingStep, useScheduling, SessionType } from "@/contexts/SchedulingContext";
import { useAvailabilityData } from "@/hooks/useAvailabilityData";
import { createSessionBooking } from "@/lib/scheduling/booking-utils";
import { useSessionBooking } from "@/contexts/SessionBookingContext";
import { format } from "date-fns";
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
  const { dispatch, setCourse, setTutor, state: contextState } = useScheduling();
  const { showConfirmation } = useSessionBooking();
  
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
    console.log("[handleBookingComplete] Starting booking process...");
    
    if (!state.selectedTimeSlot) {
      console.error("[handleBookingComplete] No time slot selected");
      toast.error("No time slot selected. Please try again.");
      return;
    }
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error("[handleBookingComplete] Auth error:", authError);
      toast.error("Authentication error. Please try logging in again.");
      return;
    }
    
    if (!user) {
      console.error("[handleBookingComplete] User not logged in");
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
      
      console.log("[handleBookingComplete] Session details:", {
        userId: user.id,
        tutorId: tutor.id,
        courseId: state.selectedCourseId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        location: locationValue,
        sessionType: sessionTypeValue,
        duration: state.selectedDuration
      });
      
      // Actually create the session in the database
      console.log("[handleBookingComplete] Calling createSessionBooking...");
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
      
      console.log("[handleBookingComplete] createSessionBooking result:", sessionDetails);
      
      if (sessionDetails) {
        console.log("[handleBookingComplete] Session created successfully:", sessionDetails);
        
        // Show animated confirmation
        showConfirmation({
          tutorName: `${tutor.firstName || tutor.name} ${tutor.lastName || ''}`.trim() || tutor.name,
          date: startTime.toISOString(),
          startTime: format(startTime, 'h:mm a'),
          endTime: format(endTime, 'h:mm a'),
          location: locationValue || 'Location TBD',
          courseName: state.selectedCourseId || undefined,
          sessionType: sessionTypeValue || 'In Person'
        });
        
        toast.success("Your session has been booked!");
        onClose();
      } else {
        console.error("[handleBookingComplete] createSessionBooking returned null");
        toast.error("Failed to book session. Please try again.");
        return;
      }
    } catch (error) {
      console.error("[handleBookingComplete] Error creating session:", error);
      if (error instanceof Error) {
        toast.error(`Booking failed: ${error.message}`);
      } else {
        toast.error("An unexpected error occurred while booking your session");
      }
      return;
    }
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
