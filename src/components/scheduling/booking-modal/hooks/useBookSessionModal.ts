
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
    
    // Store booking data in localStorage when moving to payment step
    if (nextStep === BookingStep.PAYMENT) {
      console.log("💾 Storing booking data to localStorage before payment...");
      
      // Calculate start and end times
      const startTime = new Date(selectedDate);
      const [startHour, startMinute] = state.selectedTimeSlot!.start.split(':').map(Number);
      startTime.setHours(startHour, startMinute, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + state.selectedDuration);
      
      // Calculate total amount
      const hourlyRate = tutor.hourlyRate || 25;
      const totalAmount = (hourlyRate / 60) * state.selectedDuration;
      
      const bookingData = {
        tutorId: tutor.id,
        courseId: state.selectedCourseId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        location: contextState.location || null,
        notes: contextState.notes || null,
        sessionType: contextState.sessionType || 'in_person',
        totalAmount: totalAmount
      };
      
      localStorage.setItem('currentBooking', JSON.stringify(bookingData));
      console.log("✅ Booking data stored:", bookingData);
    }
    
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
      case BookingStep.PAYMENT:
        return "Payment";
      case BookingStep.CONFIRMATION:
        return "Confirm Booking";
      default:
        return "Book a Session";
    }
  };
  
  // Handle payment completion
  const handlePaymentComplete = useCallback((sessionId: string, paymentSuccess: boolean) => {
    if (paymentSuccess) {
      // Move to confirmation step
      setState(prev => ({ ...prev, bookingStep: BookingStep.CONFIRMATION }));
      dispatch({ type: 'SET_STEP', payload: BookingStep.CONFIRMATION });
    } else {
      toast.error("Payment failed. Please try again.");
    }
  }, [dispatch]);

  // Handle booking completion (after confirmation)
  const handleBookingComplete = useCallback(async () => {
    console.log("SESSION CREATION STARTING - handleBookingComplete");
    console.log("[handleBookingComplete] Finalizing booking...");
    
    try {
      // Get booking data from localStorage
      const bookingDataStr = localStorage.getItem('currentBooking');
      if (!bookingDataStr) {
        console.error("❌ No booking data found in localStorage");
        toast.error("Booking data not found. Please try booking again.");
        return;
      }

      const booking = JSON.parse(bookingDataStr);
      console.log("💾 Retrieved booking data:", booking);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("❌ No authenticated user found");
        toast.error("Authentication required");
        return;
      }

      console.log("👤 User authenticated:", user.id);

      // Create session record
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          student_id: user.id,
          tutor_id: booking.tutorId,
          course_id: booking.courseId,
          start_time: booking.startTime,
          end_time: booking.endTime,
          location: booking.location || 'Location TBD',
          notes: booking.notes,
          session_type: booking.sessionType || 'in_person',
          status: 'scheduled',
          payment_status: 'paid'
        })
        .select()
        .single();

      if (sessionError) {
        console.error("❌ Session creation error:", sessionError);
        toast.error("Failed to create session record");
        return;
      }

      console.log("✅ Session created:", sessionData);

      // Send booking confirmation emails
      try {
        console.log("📧 Sending booking confirmation emails...");
        const { error: emailError } = await supabase.functions.invoke('send-session-emails', {
          body: { sessionId: sessionData.id }
        });
        
        if (emailError) {
          console.error("⚠️ Email sending failed:", emailError);
          // Don't fail the entire booking for email errors
        } else {
          console.log("✅ Booking confirmation emails sent");
        }
      } catch (emailError) {
        console.error("⚠️ Email sending error:", emailError);
        // Don't fail the entire booking for email errors
      }

      // Create payment transaction record
      const { error: paymentError } = await supabase
        .from('payment_transactions')
        .insert({
          session_id: sessionData.id,
          student_id: user.id,
          tutor_id: booking.tutorId,
          amount: booking.totalAmount || 0,
          status: 'completed',
          payment_completed_at: new Date().toISOString(),
          environment: 'production'
        });

      if (paymentError) {
        console.error("❌ Payment transaction error:", paymentError);
        // Don't fail completely if payment record fails - session is created
      }

      // Calculate start and end times for display
      const startTime = new Date(selectedDate);
      const [startHour, startMinute] = state.selectedTimeSlot!.start.split(':').map(Number);
      startTime.setHours(startHour, startMinute, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + state.selectedDuration);

      // Show confirmation with session details
      showConfirmation({
        tutorName: tutor.name,
        date: format(selectedDate, 'EEEE, MMMM d, yyyy'),
        startTime: format(startTime, 'h:mm a'),
        endTime: format(endTime, 'h:mm a'),
        location: contextState.location || 'Location TBD',
        courseName: state.selectedCourseId || undefined,
        sessionType: contextState.sessionType || 'In Person'
      });
      
      toast.success("Your session has been booked and payment processed!");
      
      // Clear booking data
      localStorage.removeItem('currentBooking');
      
      onClose();
    } catch (error) {
      console.error("[handleBookingComplete] Error finalizing booking:", error);
      toast.error("Booking confirmation failed");
    }
  }, [onClose, tutor, selectedDate, state, contextState, showConfirmation]);

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
    handlePaymentComplete,
    getStepTitle
  };
}
