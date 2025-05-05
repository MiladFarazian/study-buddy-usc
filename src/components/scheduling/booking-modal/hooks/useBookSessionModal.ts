
import { useState, useEffect, useCallback } from "react";
import { addDays, startOfDay } from "date-fns";
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling/types";
import { toast } from "sonner";
import { BookingStep } from "@/contexts/SchedulingContext";
import { useAvailabilityData } from "@/hooks/useAvailabilityData";
import { addToGoogleCalendar } from "@/lib/calendar/googleCalendarUtils";
import { ICalEventData, downloadICSFile } from "@/lib/calendar/icsGenerator";

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
  
  // State for selected date
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (initialDate) return startOfDay(initialDate);
    return startOfDay(new Date());
  });
  
  // If the modal is closed, reset state
  useEffect(() => {
    if (!isOpen) {
      setState({
        bookingStep: BookingStep.SELECT_DATE_TIME,
        selectedTimeSlot: null,
        selectedDuration: 60,
        selectedCourseId: null
      });
    }
  }, [isOpen]);
  
  // Get available slots for the selected date
  const { availableSlots, loading, errorMessage, refreshAvailability } = 
    useAvailabilityData(tutor, selectedDate);
  
  // Check if there's any availability
  const hasAvailability = availableSlots.length > 0;
  
  // Handle date change
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setState(prev => ({ ...prev, selectedTimeSlot: null }));
  };
  
  // Handle slot selection
  const handleSelectSlot = (slot: BookingSlot) => {
    setState(prev => ({ ...prev, selectedTimeSlot: slot }));
  };
  
  // Handle duration change
  const handleDurationChange = (duration: number) => {
    setState(prev => ({ ...prev, selectedDuration: duration }));
  };
  
  // Handle course selection
  const handleCourseChange = (courseId: string | null) => {
    setState(prev => ({ ...prev, selectedCourseId: courseId }));
    console.log("Course changed to:", courseId);
  };
  
  // Handle when user continues to next step
  const handleContinue = () => {
    if (state.bookingStep === BookingStep.SELECT_COURSE) {
      console.log("Selected course:", state.selectedCourseId);
    }
    setState(prev => ({ 
      ...prev, 
      bookingStep: prev.bookingStep + 1 as BookingStep 
    }));
  };
  
  // Handle when user goes back to previous step
  const handleBack = () => {
    setState(prev => ({ 
      ...prev, 
      bookingStep: Math.max(0, prev.bookingStep - 1) as BookingStep 
    }));
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
  const handleBookingComplete = useCallback(() => {
    console.log("Booking completed!");
    toast.success("Your session has been booked!");
    
    // Here we would typically make an API call to save the booking
    // For now, we'll just log the details and close the modal
    console.log("Booking details:", {
      tutor: tutor.name,
      date: selectedDate,
      timeSlot: state.selectedTimeSlot,
      duration: state.selectedDuration,
      course: state.selectedCourseId
    });
    
    onClose();
  }, [onClose, tutor, selectedDate, state]);

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
