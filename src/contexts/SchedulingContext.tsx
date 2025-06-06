
import React, { createContext, useContext, useState, useReducer, ReactNode, useCallback } from 'react';
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling/types";
import { toast } from "sonner";

// Define the session type enum
export enum SessionType {
  IN_PERSON = 'in_person',
  VIRTUAL = 'virtual'
}

// Define the booking steps enum
export enum BookingStep {
  SELECT_DATE_TIME = 0,
  SELECT_DURATION = 1,
  SELECT_COURSE = 2,
  SELECT_SESSION_TYPE = 3,
  FILL_FORM = 4,
  CONFIRMATION = 5,
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
  selectedCourseId: string | null;
  sessionType: SessionType;
  location: string | null;
}

// Define the scheduling actions
type SchedulingAction = 
  | { type: 'SELECT_DATE'; payload: Date }
  | { type: 'SELECT_TIME_SLOT'; payload: BookingSlot }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_STEP'; payload: BookingStep }
  | { type: 'SET_NOTES'; payload: string }
  | { type: 'SET_STUDENT_INFO'; payload: { name: string; email: string } }
  | { type: 'SET_COURSE'; payload: string | null }
  | { type: 'SET_SESSION_TYPE'; payload: SessionType }
  | { type: 'SET_LOCATION'; payload: string | null }
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
  selectedCourseId: null,
  sessionType: SessionType.IN_PERSON,
  location: null,
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
      return { ...state, selectedCourseId: action.payload };
    case 'SET_SESSION_TYPE':
      return { ...state, sessionType: action.payload };
    case 'SET_LOCATION':
      return { ...state, location: action.payload };
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
  setCourse: (courseId: string | null) => void;
  setSessionType: (type: SessionType) => void;
  setLocation: (location: string | null) => void;
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
    console.log("[SchedulingContext] Setting course ID:", courseId);
    dispatch({ type: 'SET_COURSE', payload: courseId });
  }, [dispatch]);

  // Helper function to set the session type
  const setSessionType = useCallback((type: SessionType) => {
    console.log("[SchedulingContext] Setting session type:", type);
    dispatch({ type: 'SET_SESSION_TYPE', payload: type });
  }, [dispatch]);

  // Helper function to set the location
  const setLocation = useCallback((location: string | null) => {
    console.log("[SchedulingContext] Setting location:", location);
    dispatch({ type: 'SET_LOCATION', payload: location });
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
      case BookingStep.SELECT_COURSE:
        // Course is optional, so no validation needed
        break;
      case BookingStep.SELECT_SESSION_TYPE:
        // Session type is required but always has a default value
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
      setCourse,
      setSessionType,
      setLocation
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
