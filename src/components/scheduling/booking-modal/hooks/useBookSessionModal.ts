
import { useState, useEffect, useCallback } from 'react';
import { useScheduling, BookingStep } from '@/contexts/SchedulingContext';
import { Tutor } from '@/types/tutor';
import { BookingSlot } from '@/lib/scheduling/types';
import { useAuthState } from '@/hooks/useAuthState';
import { createSessionBooking } from '@/lib/scheduling/booking-utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { parseISO, format, isValid } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import useTutorStudentCourses from '@/hooks/useTutorStudentCourses';

export function useBookSessionModal(
  tutor: Tutor, 
  isOpen: boolean, 
  onClose: () => void,
  initialDate?: Date,
  initialTime?: string
) {
  const { state, dispatch, setCourse } = useScheduling();
  const { user } = useAuthState();
  const navigate = useNavigate();
  const { courses } = useTutorStudentCourses();
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([]);
  const [hasAvailability, setHasAvailability] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  
  // Initialize with initial date and time if provided
  useEffect(() => {
    if (isOpen && initialDate) {
      setSelectedDate(initialDate);
      
      if (initialTime) {
        // Try to match the time format to find the right slot
        // This assumes initialTime is in a format like "14:00"
        const matchedSlot = availableSlots.find(slot => slot.start === initialTime);
        if (matchedSlot) {
          handleSelectSlot(matchedSlot);
        }
      }
    }
  }, [isOpen, initialDate, initialTime, availableSlots]);
  
  // Fetch available slots when date changes
  useEffect(() => {
    if (selectedDate && tutor?.id) {
      loadAvailableSlots(selectedDate, tutor.id);
    }
  }, [selectedDate, tutor?.id]);
  
  // Load available slots for the selected date
  const loadAvailableSlots = async (date: Date, tutorId: string) => {
    setLoading(true);
    setErrorMessage(null);
    
    try {
      // Construct date strings for the query
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Get tutor availability
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('tutor_availability')
        .select('availability')
        .eq('tutor_id', tutorId)
        .single();
        
      if (availabilityError) {
        throw availabilityError;
      }
      
      if (!availabilityData || !availabilityData.availability) {
        setHasAvailability(false);
        setAvailableSlots([]);
        setLoading(false);
        return;
      }
      
      // Get booked sessions for this date
      const { data: bookedSessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('start_time, end_time')
        .eq('tutor_id', tutorId)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .in('status', ['confirmed', 'pending']);
        
      if (sessionsError) {
        throw sessionsError;
      }
      
      // Get day of week (0-6, where 0 is Sunday)
      const dayOfWeek = date.getDay();
      const dayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
      
      // Check if tutor has availability for this day
      const dayAvailability = availabilityData.availability[dayKey];
      
      if (!dayAvailability || dayAvailability.length === 0) {
        setHasAvailability(false);
        setAvailableSlots([]);
        setLoading(false);
        return;
      }
      
      // Generate 30-minute slots from availability
      const generatedSlots: BookingSlot[] = [];
      
      for (const timeSlot of dayAvailability) {
        const [startHour, startMinute] = timeSlot.start.split(':').map(Number);
        const [endHour, endMinute] = timeSlot.end.split(':').map(Number);
        
        let currentHour = startHour;
        let currentMinute = startMinute;
        
        while (
          currentHour < endHour || 
          (currentHour === endHour && currentMinute < endMinute)
        ) {
          const slotEndHour = currentMinute + 30 >= 60 ? currentHour + 1 : currentHour;
          const slotEndMinute = (currentMinute + 30) % 60;
          
          // Skip if this would exceed the end time
          if (
            slotEndHour > endHour || 
            (slotEndHour === endHour && slotEndMinute > endMinute)
          ) {
            break;
          }
          
          // Format start and end times
          const startFormatted = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
          const endFormatted = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute.toString().padStart(2, '0')}`;
          
          // Create a slot with tutorId included (fixing the error)
          const slot: BookingSlot = {
            day: date,
            start: startFormatted,
            end: endFormatted,
            available: true,
            tutorId: tutorId // Add the tutorId property here
          };
          
          // Check if this slot overlaps with any booked session
          bookedSessions.forEach(session => {
            const sessionDate = new Date(session.start_time);
            
            // Only check sessions on the same day
            if (sessionDate.toDateString() === date.toDateString()) {
              const sessionStartMinutes = convertTimeToMinutes(session.start_time);
              const sessionEndMinutes = convertTimeToMinutes(session.end_time);
              
              // Check for overlap
              if (
                (currentHour * 60 + currentMinute) >= sessionStartMinutes && 
                (currentHour * 60 + currentMinute) < sessionEndMinutes
              ) {
                slot.available = false;
              }
            }
          });
          
          // Add to available slots
          generatedSlots.push(slot);
          
          // Move to next slot
          currentHour = slotEndMinute === 0 ? slotEndHour : currentHour;
          currentMinute = slotEndMinute;
        }
      }
      
      // Filter to only available slots and sort by time
      const availableSlots = generatedSlots
        .filter(slot => slot.available)
        .sort((a, b) => a.start.localeCompare(b.start));
      
      setAvailableSlots(availableSlots);
      setHasAvailability(availableSlots.length > 0);
      
      if (!availableSlots.length) {
        setErrorMessage("This tutor is fully booked for the selected date.");
      } else {
        setErrorMessage(null);
      }
      
    } catch (error) {
      console.error("Error loading available slots:", error);
      setErrorMessage("Failed to load available times. Please try again.");
      setHasAvailability(false);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to convert time to minutes since start of day
  const convertTimeToMinutes = (timeString: string): number => {
    const date = new Date(timeString);
    return date.getHours() * 60 + date.getMinutes();
  };
  
  // Refresh availability
  const refreshAvailability = () => {
    if (selectedDate && tutor?.id) {
      loadAvailableSlots(selectedDate, tutor.id);
    }
  };
  
  // Handle date change
  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      dispatch({ type: 'SELECT_DATE', payload: date });
    }
  };
  
  // Handle slot selection
  const handleSelectSlot = (slot: BookingSlot) => {
    dispatch({ type: 'SELECT_TIME_SLOT', payload: slot });
    dispatch({ type: 'SET_STEP', payload: BookingStep.SELECT_DURATION });
  };
  
  // Handle duration change
  const handleDurationChange = (minutes: number) => {
    dispatch({ type: 'SET_DURATION', payload: minutes });
    dispatch({ type: 'SET_STEP', payload: BookingStep.SELECT_COURSE });
  };
  
  // Handle course change
  const handleCourseChange = (courseId: string | null) => {
    console.log("Selecting course in useBookSessionModal:", courseId);
    setCourse(courseId);
    dispatch({ type: 'SET_STEP', payload: BookingStep.SELECT_SESSION_TYPE });
  };
  
  // Handle close
  const handleClose = () => {
    onClose();
  };
  
  // Handle continue
  const handleContinue = () => {
    const nextStep = state.bookingStep + 1;
    dispatch({ type: 'SET_STEP', payload: nextStep as BookingStep });
  };
  
  // Handle back
  const handleBack = () => {
    if (state.bookingStep > 0) {
      const prevStep = state.bookingStep - 1;
      dispatch({ type: 'SET_STEP', payload: prevStep as BookingStep });
    }
  };
  
  // Handle booking completion
  const handleBookingComplete = async () => {
    if (!user || !state.selectedTimeSlot || !tutor) {
      toast.error("Missing required information for booking");
      return;
    }
    
    setLoading(true);
    
    try {
      // Calculate booking start and end times
      const bookingDate = new Date(state.selectedTimeSlot.day);
      const [startHour, startMinute] = state.selectedTimeSlot.start.split(':').map(Number);
      bookingDate.setHours(startHour, startMinute, 0, 0);
      
      const endTime = new Date(bookingDate);
      endTime.setMinutes(endTime.getMinutes() + state.selectedDuration);
      
      console.log("Booking session with:", {
        studentId: user.id,
        tutorId: tutor.id,
        courseId: state.selectedCourseId,
        startTime: bookingDate.toISOString(),
        endTime: endTime.toISOString(),
        sessionType: state.sessionType,
        location: state.location
      });
      
      // Create the session
      const result = await createSessionBooking(
        user.id,
        tutor.id,
        state.selectedCourseId,
        bookingDate.toISOString(),
        endTime.toISOString(),
        state.location,
        state.notes,
        state.sessionType
      );
      
      if (!result) {
        throw new Error("Failed to create session");
      }
      
      console.log("Session created successfully:", result);
      
      toast.success("Session booked successfully!");
      
      // Reset form
      dispatch({ type: 'RESET' });
      
      // Close modal
      onClose();
      
      // Redirect to schedule page after a short delay
      setTimeout(() => {
        navigate('/schedule');
      }, 500);
    } catch (error) {
      console.error("Error booking session:", error);
      toast.error("Failed to book session. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Get step title
  const getStepTitle = () => {
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
        return "Additional Details";
      case BookingStep.CONFIRMATION:
        return "Confirm Booking";
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
    handleDurationChange,
    handleCourseChange,
    handleClose,
    handleContinue,
    handleBack,
    handleBookingComplete,
    getStepTitle
  };
}
