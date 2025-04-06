import { useState, useCallback } from 'react';
import { BookingStep } from '@/contexts/SchedulingContext';
import { useSessionCreation } from './useSessionCreation';
import { useSlotSelection } from './useSlotSelection';
import { usePaymentSetup } from './usePaymentSetup';
import { useAuthState } from '@/hooks/useAuthState';
import { Tutor } from '@/types/tutor';
import { BookingSlot } from '@/lib/scheduling/types';

export type BookingStep = 'select-slot' | 'payment' | 'processing';

/**
 * Hook for managing the booking flow state
 */
export function useBookingFlow() {
  const [step, setStep] = useState<BookingStep>('select-slot');
  const [authRequired, setAuthRequired] = useState(false);
  
  /**
   * Reset the booking flow
   */
  const resetBookingFlow = useCallback(() => {
    setStep('select-slot');
    setAuthRequired(false);
  }, []);
  
  /**
   * Move to the next step in the booking flow
   */
  const moveToNextStep = useCallback((nextStep: BookingStep) => {
    setStep(nextStep);
  }, []);
  
  return {
    step,
    setStep,
    authRequired,
    setAuthRequired,
    resetBookingFlow,
    moveToNextStep
  };
}
