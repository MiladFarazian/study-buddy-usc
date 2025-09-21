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
import { createZoomMeeting } from "@/lib/zoomAPI";
import { dollarsToCents } from "@/lib/currency-utils";

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
  
  // State for booking completion loading
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

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
      setIsConfirmed(false);
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
  
  // Handle date and time change together (for calendar-based selection)
  const handleDateTimeChange = (date: Date, time: string) => {
    setSelectedDate(date);
    
    // Create a booking slot for the selected date/time
    const bookingSlot: BookingSlot = {
      day: date,
      start: time,
      end: `${(parseInt(time.split(':')[0]) + 1).toString().padStart(2, '0')}:00`,
      available: true,
      tutorId: tutor.id,
      durationMinutes: 60
    };
    
    setState(prev => ({ ...prev, selectedTimeSlot: bookingSlot }));
    dispatch({ type: 'SELECT_DATE', payload: date });
    dispatch({ type: 'SELECT_TIME_SLOT', payload: bookingSlot });
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
        return "Session Confirmed";
      default:
        return "Book a Session";
    }
  };
  
  // Handle booking completion (after confirmation) 
  const handleBookingCompleteImpl = useCallback(async () => {
    console.log("SESSION CREATION STARTING - handleBookingComplete");
    console.log("[handleBookingComplete] Finalizing booking...");
    
    setBookingInProgress(true);
    
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

      // Create Zoom meeting if session type is virtual
      if (booking.sessionType === 'virtual') {
        console.log("🔗 Creating Zoom meeting for virtual session...");
        try {
          const zoomResult = await createZoomMeeting({
            tutor_id: booking.tutorId,
            student_name: user.user_metadata?.full_name || user.email || 'Student',
            course_name: state.selectedCourseId || 'Tutoring Session',
            start_time: booking.startTime,
            end_time: booking.endTime
          });

          if (zoomResult.error) {
            console.error("⚠️ Zoom meeting creation failed:", zoomResult.error);
            toast.error("Session created but Zoom meeting setup failed");
          } else if (zoomResult.id && zoomResult.join_url) {
            console.log("✅ Zoom meeting created:", zoomResult.id);
            
            // Update session with Zoom details
            const { error: zoomUpdateError } = await supabase
              .from('sessions')
              .update({
                zoom_meeting_id: zoomResult.id,
                zoom_join_url: zoomResult.join_url,
                zoom_start_url: zoomResult.start_url,
                zoom_password: zoomResult.password
              })
              .eq('id', sessionData.id);
              
            if (zoomUpdateError) {
              console.error("⚠️ Failed to save Zoom details:", zoomUpdateError);
            } else {
              console.log("✅ Zoom details saved to session");
            }
          }
        } catch (zoomError) {
          console.error("⚠️ Zoom creation error:", zoomError);
          toast.error("Session created but Zoom meeting setup failed");
        }
      }

      // Send booking confirmation emails
      try {
        console.log("📧 Sending booking confirmation emails...");
        const { error: emailError } = await supabase.functions.invoke('send-session-emails', {
          body: { 
            sessionId: sessionData.id,
            emailType: 'confirmation'
          }
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
          amount: dollarsToCents(booking.totalAmount || 0),
          status: 'completed',
          payment_completed_at: new Date().toISOString(),
          environment: 'production'
        });

      if (paymentError) {
        console.error("❌ Payment transaction error:", paymentError);
        // Don't fail completely if payment record fails - session is created
      }

      // No longer showing the confirmation popup - just success message
      // Session details are shown in the confirmation step instead
      
      toast.success("Your session has been booked and payment processed!");
      
      // Clear booking data
      localStorage.removeItem('currentBooking');
      
      // Set confirmed state instead of closing modal
      setIsConfirmed(true);
    } catch (error) {
      console.error("[handleBookingComplete] Error finalizing booking:", error);
      toast.error("Booking confirmation failed");
    } finally {
      setBookingInProgress(false);
    }
  }, [onClose, tutor, selectedDate, state, contextState]);

  // Handle payment completion - auto-confirm after successful payment
  const handlePaymentComplete = useCallback(async (sessionId: string, paymentSuccess: boolean) => {
    if (paymentSuccess) {
      // Auto-confirm the booking immediately after successful payment
      setState(prev => ({ ...prev, bookingStep: BookingStep.CONFIRMATION }));
      dispatch({ type: 'SET_STEP', payload: BookingStep.CONFIRMATION });
      
      // Auto-confirm by calling handleBookingComplete (defined below)
      setTimeout(() => {
        handleBookingCompleteImpl();
      }, 100);
    } else {
      toast.error("Payment failed. Please try again.");
    }
  }, [dispatch, handleBookingCompleteImpl]);

  // Create the public handleBookingComplete that calls the implementation
  const handleBookingComplete = useCallback(async () => {
    await handleBookingCompleteImpl();
  }, [handleBookingCompleteImpl]);

  return {
    selectedDate,
    state,
    loading,
    bookingInProgress,
    isConfirmed,
    availableSlots,
    hasAvailability,
    errorMessage,
    refreshAvailability,
    handleDateChange: handleDateTimeChange,
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