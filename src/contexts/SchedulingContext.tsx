
import React, { createContext, useContext, useReducer, useState } from 'react';
import { Tutor } from '@/types/tutor';
import { BookingSlot } from '@/types/scheduling';

// Define the booking steps
export enum BookingStep {
  SELECT_DATE_TIME = 'SELECT_DATE_TIME',
  SELECT_DURATION = 'SELECT_DURATION',
  FILL_FORM = 'FILL_FORM',
  CONFIRMATION = 'CONFIRMATION'
}

// Define the state interface
interface SchedulingState {
  bookingStep: BookingStep;
  selectedDate: Date | null;
  selectedTimeSlot: BookingSlot | null;
  sessionDuration: number;
  sessionCost: number;
  notes: string;
  studentName: string;
  studentEmail: string;
}

// Define the action types
type SchedulingAction =
  | { type: 'SET_STEP'; payload: BookingStep }
  | { type: 'SELECT_DATE'; payload: Date }
  | { type: 'SELECT_TIME_SLOT'; payload: BookingSlot }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_COST'; payload: number }
  | { type: 'SET_NOTES'; payload: string }
  | { type: 'SET_STUDENT_NAME'; payload: string }
  | { type: 'SET_STUDENT_EMAIL'; payload: string }
  | { type: 'RESET' };

// Define the initial state
const initialState: SchedulingState = {
  bookingStep: BookingStep.SELECT_DATE_TIME,
  selectedDate: null,
  selectedTimeSlot: null,
  sessionDuration: 60, // Default to 60 minutes
  sessionCost: 0,
  notes: '',
  studentName: '',
  studentEmail: ''
};

// Create the reducer function
const schedulingReducer = (state: SchedulingState, action: SchedulingAction): SchedulingState => {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, bookingStep: action.payload };
    case 'SELECT_DATE':
      return { ...state, selectedDate: action.payload };
    case 'SELECT_TIME_SLOT':
      return { ...state, selectedTimeSlot: action.payload };
    case 'SET_DURATION':
      return { ...state, sessionDuration: action.payload };
    case 'SET_COST':
      return { ...state, sessionCost: action.payload };
    case 'SET_NOTES':
      return { ...state, notes: action.payload };
    case 'SET_STUDENT_NAME':
      return { ...state, studentName: action.payload };
    case 'SET_STUDENT_EMAIL':
      return { ...state, studentEmail: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

// Create the context
interface SchedulingContextType {
  state: SchedulingState;
  dispatch: React.Dispatch<SchedulingAction>;
  tutor: Tutor | null;
  setTutor: (tutor: Tutor) => void;
  continueToNextStep: () => void;
  goToPreviousStep: () => void;
  calculatePrice: (durationMinutes: number) => number;
}

const SchedulingContext = createContext<SchedulingContextType | undefined>(undefined);

// Create the provider component
export const SchedulingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(schedulingReducer, initialState);
  const [tutor, setTutor] = useState<Tutor | null>(null);

  const continueToNextStep = () => {
    switch (state.bookingStep) {
      case BookingStep.SELECT_DATE_TIME:
        dispatch({ type: 'SET_STEP', payload: BookingStep.SELECT_DURATION });
        break;
      case BookingStep.SELECT_DURATION:
        dispatch({ type: 'SET_STEP', payload: BookingStep.FILL_FORM });
        break;
      case BookingStep.FILL_FORM:
        dispatch({ type: 'SET_STEP', payload: BookingStep.CONFIRMATION });
        break;
      default:
        break;
    }
  };

  const goToPreviousStep = () => {
    switch (state.bookingStep) {
      case BookingStep.SELECT_DURATION:
        dispatch({ type: 'SET_STEP', payload: BookingStep.SELECT_DATE_TIME });
        break;
      case BookingStep.FILL_FORM:
        dispatch({ type: 'SET_STEP', payload: BookingStep.SELECT_DURATION });
        break;
      case BookingStep.CONFIRMATION:
        dispatch({ type: 'SET_STEP', payload: BookingStep.FILL_FORM });
        break;
      default:
        break;
    }
  };

  // Calculate price based on tutor's hourly rate and session duration
  const calculatePrice = (durationMinutes: number): number => {
    if (!tutor || !tutor.hourlyRate) return 0;
    
    const hourlyRate = tutor.hourlyRate;
    const durationHours = durationMinutes / 60;
    return Math.round(hourlyRate * durationHours);
  };

  return (
    <SchedulingContext.Provider
      value={{
        state,
        dispatch,
        tutor,
        setTutor,
        continueToNextStep,
        goToPreviousStep,
        calculatePrice
      }}
    >
      {children}
    </SchedulingContext.Provider>
  );
};

// Create a hook to use the scheduling context
export const useScheduling = (): SchedulingContextType => {
  const context = useContext(SchedulingContext);
  if (!context) {
    throw new Error('useScheduling must be used within a SchedulingProvider');
  }
  return context;
};
