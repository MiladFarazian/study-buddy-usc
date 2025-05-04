
import { useState, useEffect } from "react";
import { useAvailabilityData } from "@/hooks/useAvailabilityData";
import { Tutor } from "@/types/tutor";
import { useScheduling, BookingStep } from "@/contexts/SchedulingContext";
import { startOfDay } from "date-fns";
import { toast } from "sonner";

export function useBookSessionModal(
  tutor: Tutor,
  isOpen: boolean,
  onClose: () => void,
  initialDate?: Date,
  initialTime?: string
) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const { state, dispatch, setTutor, continueToNextStep, goToPreviousStep } = useScheduling();
  
  // Initialize starting date
  const today = startOfDay(new Date());
  
  // Fetch availability data
  const { 
    loading, 
    availableSlots, 
    hasAvailability, 
    errorMessage,
    refreshAvailability
  } = useAvailabilityData(tutor, today);

  // Set the tutor in the scheduling context
  useEffect(() => {
    if (tutor && tutor.id) {
      setTutor(tutor);
    }
    
    // Initialize with initial date/time if provided
    if (initialDate) {
      setSelectedDate(initialDate);
      dispatch({ type: 'SELECT_DATE', payload: initialDate });
    }
  }, [tutor, setTutor, initialDate, dispatch]);

  // Debug log for tracking availability
  useEffect(() => {
    console.log(`BookSessionModal: ${availableSlots.length} slots available, loading: ${loading}`);
    
    // When loading completes with no slots, show a toast
    if (!loading && availableSlots.length === 0 && isOpen) {
      toast.error("No available slots found for this tutor");
    }
  }, [loading, availableSlots.length, isOpen]);

  const handleDateChange = (date: Date) => {
    console.log("Date changed to:", date);
    setSelectedDate(date);
    dispatch({ type: 'SELECT_DATE', payload: date });
  };

  const handleSelectSlot = (slot: any) => {
    console.log("Selected slot:", slot);
    dispatch({ type: 'SELECT_TIME_SLOT', payload: slot });
  };

  const handleClose = () => {
    // Reset the booking state when closing
    dispatch({ type: 'RESET' });
    onClose();
  };

  // Handler for moving to the next step
  const handleContinue = () => {
    console.log("Moving to next step from:", state.bookingStep);
    continueToNextStep();
  };

  // Handler for moving to the previous step
  const handleBack = () => {
    console.log("Moving to previous step from:", state.bookingStep);
    goToPreviousStep();
  };
  
  const handleBookingComplete = () => {
    toast.success("Session booked successfully!");
    handleClose();
  };

  const getStepTitle = (): string => {
    switch (state.bookingStep) {
      case BookingStep.SELECT_DATE_TIME:
        return "Select Date & Time";
      case BookingStep.SELECT_DURATION:
        return "Select Session Duration";
      case BookingStep.SELECT_COURSE:
        return "Select Course";
      case BookingStep.SELECT_SESSION_TYPE:
        return "Session Location";
      case BookingStep.FILL_FORM:
        return "Your Details";
      case BookingStep.CONFIRMATION:
        return "Confirm Your Booking";
      default:
        return "Book a Session";
    }
  };
  
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
    handleClose,
    handleContinue,
    handleBack,
    handleBookingComplete,
    getStepTitle
  };
}
