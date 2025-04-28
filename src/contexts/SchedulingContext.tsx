
import React, { createContext, useContext, useState, useReducer, ReactNode, useCallback } from 'react';
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling/types";
import { toast } from "sonner";

// Define the booking steps enum
export enum BookingStep {
  SELECT_DATE_TIME = 0,
  SELECT_DURATION = 1,
  FILL_FORM = 2,
  CONFIRMATION = 3,
}

// Define the scheduling state
interface SchedulingState {
  selectedDate: Date | null;
  selectedTimeSlot: BookingSlot | null;
  selectedDuration: number;
  bookingStep: BookingStep;
  notes: string;
  studentName: string;
  studentEmail: string;
  selectedCourseId: string | null; // Add selected course ID to state
}

// Define the scheduling actions
type SchedulingAction = 
  | { type: 'SELECT_DATE'; payload: Date }
  | { type: 'SELECT_TIME_SLOT'; payload: BookingSlot }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_STEP'; payload: BookingStep }
  | { type: 'SET_NOTES'; payload: string }
  | { type: 'SET_STUDENT_INFO'; payload: { name: string; email: string } }
  | { type: 'SET_COURSE'; payload: string | null } // Add new action for course selection
  | { type: 'RESET' };

// Initial state
const initialState: SchedulingState = {
  selectedDate: null,
  selectedTimeSlot: null,
  selectedDuration: 60, // Default 1 hour
  bookingStep: BookingStep.SELECT_DATE_TIME,
  notes: '',
  studentName: '',
  studentEmail: '',
  selectedCourseId: null, // Default to null (general session)
};

// Reducer function
function schedulingReducer(state: SchedulingState, action: SchedulingAction): SchedulingState {
  switch (action.type) {
    case 'SELECT_DATE':
      return { ...state, selectedDate: action.payload };
    case 'SELECT_TIME_SLOT':
      return { ...state, selectedTimeSlot: action.payload };
    case 'SET_DURATION':
      return { ...state, selectedDuration: action.payload };
    case 'SET_STEP':
      return { ...state, bookingStep: action.payload };
    case 'SET_NOTES':
      return { ...state, notes: action.payload };
    case 'SET_STUDENT_INFO':
      return { 
        ...state, 
        studentName: action.payload.name, 
        studentEmail: action.payload.email 
      };
    case 'SET_COURSE':
      return { ...state, selectedCourseId: action.payload }; // Handle course selection
    case 'RESET':
      return { 
        ...initialState,
        bookingStep: BookingStep.SELECT_DATE_TIME 
      };
    default:
      return state;
  }
}

// Create the context
interface SchedulingContextType {
  state: SchedulingState;
  dispatch: React.Dispatch<SchedulingAction>;
  tutor: Tutor | null;
  setTutor: (tutor: Tutor) => void;
  calculatePrice: (durationMinutes: number) => number;
  continueToNextStep: () => void;
  goToPreviousStep: () => void;
  setCourse: (courseId: string | null) => void; // Add helper function for setting course
}

const SchedulingContext = createContext<SchedulingContextType | undefined>(undefined);

// Provider component
export const SchedulingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(schedulingReducer, initialState);
  const [tutor, setTutorState] = useState<Tutor | null>(null);

  const setTutor = (newTutor: Tutor) => {
    setTutorState(newTutor);
  };

  const calculatePrice = useCallback((durationMinutes: number): number => {
    if (!tutor) return 0;
    
    // Calculate price based on tutor's hourly rate and duration
    const hourlyRate = tutor.hourlyRate || 25; // Use tutor's rate or default to $25
    return (hourlyRate / 60) * durationMinutes;
  }, [tutor]);

  // Helper function to set the selected course
  const setCourse = useCallback((courseId: string | null) => {
    dispatch({ type: 'SET_COURSE', payload: courseId });
  }, [dispatch]);

  const continueToNextStep = useCallback(() => {
    // Validation before moving to the next step
    switch (state.bookingStep) {
      case BookingStep.SELECT_DATE_TIME:
        if (!state.selectedDate || !state.selectedTimeSlot) {
          toast.error("Please select both a date and time to continue");
          return;
        }
        break;
      case BookingStep.SELECT_DURATION:
        if (!state.selectedDuration) {
          toast.error("Please select a session duration");
          return;
        }
        break;
      case BookingStep.FILL_FORM:
        if (!state.studentName || !state.studentEmail) {
          toast.error("Please fill in all required fields");
          return;
        }
        // Simple email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(state.studentEmail)) {
          toast.error("Please enter a valid email address");
          return;
        }
        break;
    }

    // Move to the next step
    const nextStep = state.bookingStep + 1;
    dispatch({ type: 'SET_STEP', payload: nextStep as BookingStep });
  }, [state]);

  const goToPreviousStep = useCallback(() => {
    if (state.bookingStep > 0) {
      const prevStep = state.bookingStep - 1;
      dispatch({ type: 'SET_STEP', payload: prevStep as BookingStep });
    }
  }, [state.bookingStep]);

  return (
    <SchedulingContext.Provider value={{ 
      state, 
      dispatch, 
      tutor, 
      setTutor, 
      calculatePrice,
      continueToNextStep,
      goToPreviousStep,
      setCourse // Add the setCourse function to the context
    }}>
      {children}
    </SchedulingContext.Provider>
  );
};

// Hook for using the scheduling context
export const useScheduling = () => {
  const context = useContext(SchedulingContext);
  if (context === undefined) {
    throw new Error('useScheduling must be used within a SchedulingProvider');
  }
  return context;
};
