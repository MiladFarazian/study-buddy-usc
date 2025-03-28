
import React, { createContext, useContext, useState, useReducer, ReactNode } from 'react';
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling/types";

// Define the scheduling state
interface SchedulingState {
  selectedDate: Date | null;
  selectedTimeSlot: BookingSlot | null;
  selectedDuration: number;
  bookingStep: 'date' | 'time' | 'details' | 'payment' | 'confirmation';
  notes: string;
}

// Define the scheduling actions
type SchedulingAction = 
  | { type: 'SELECT_DATE'; payload: Date }
  | { type: 'SELECT_TIME_SLOT'; payload: BookingSlot }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_STEP'; payload: SchedulingState['bookingStep'] }
  | { type: 'SET_NOTES'; payload: string }
  | { type: 'RESET' };

// Initial state
const initialState: SchedulingState = {
  selectedDate: null,
  selectedTimeSlot: null,
  selectedDuration: 60, // Default 1 hour
  bookingStep: 'date',
  notes: '',
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
    case 'RESET':
      return initialState;
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
}

const SchedulingContext = createContext<SchedulingContextType | undefined>(undefined);

// Provider component
export const SchedulingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(schedulingReducer, initialState);
  const [tutor, setTutorState] = useState<Tutor | null>(null);

  const setTutor = (newTutor: Tutor) => {
    setTutorState(newTutor);
  };

  const calculatePrice = (durationMinutes: number) => {
    if (!tutor) return 0;
    
    // Calculate price based on tutor's hourly rate and duration
    const hourlyRate = tutor.hourlyRate || 25; // Default $25/hour
    return (hourlyRate / 60) * durationMinutes;
  };

  return (
    <SchedulingContext.Provider value={{ state, dispatch, tutor, setTutor, calculatePrice }}>
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
