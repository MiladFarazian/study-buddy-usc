import { useState, useCallback } from 'react';
import { useAuthState } from '@/hooks/useAuthState';
import { BookingSlot } from '@/lib/scheduling/types';
import { Tutor } from '@/types/tutor';
import { useSessionCreation } from './useSessionCreation';
import { usePaymentSetup } from './usePaymentSetup';
import { useSlotSelection } from './useSlotSelection';
import { useBookingFlow } from './useBookingFlow';
import { useRateLimiter } from './useRateLimiter';

/**
 * Primary hook for the booking session flow, composing the other specialized hooks
 */
export function useBookingSession(tutor: Tutor, isOpen: boolean, onClose: () => void) {
  const { user } = useAuthState();
  const { 
    step, 
    setStep, 
    authRequired, 
    setAuthRequired, 
    resetBookingFlow 
  } = useBookingFlow();
  
  const {
    selectedSlot,
    setSelectedSlot,
    calculatePaymentAmount
  } = useSlotSelection();
  
  const {
    creatingSession,
    setCreatingSession,
    sessionId,
    setSessionId,
    createSession
  } = useSessionCreation();
  
  const {
    clientSecret,
    setClientSecret,
    paymentAmount,
    setPaymentAmount,
    paymentError,
    setPaymentError,
    isTwoStagePayment,
    setIsTwoStagePayment,
    setupPayment,
    resetPaymentSetup,
    isProcessing
  } = usePaymentSetup();
  
  // Use the rate limiter
  const { isLimited, markAttempt, setupInProgress } = useRateLimiter();
  
  // Reset the flow when the modal is closed
  useSessionReset(isOpen, resetBookingFlow, setSelectedSlot, setSessionId, resetPaymentSetup, setCreatingSession);
  
  // Handle slot selection
  const handleSlotSelect = useCallback(async (slot: BookingSlot) => {
    if (!user) {
      setAuthRequired(true);
      return;
    }
    
    // Check rate limiting
    if (isLimited() || setupInProgress()) {
      return;
    }
    
    markAttempt();
    
    try {
      setSelectedSlot(slot);
      
      // Calculate payment amount (hourly rate prorated by duration)
      const hourlyRate = tutor.hourlyRate || 50; // default to $50 if not set
      const amount = calculatePaymentAmount(slot, hourlyRate);
      
      // Create a new session
      setCreatingSession(true);
      const session = await createSession(slot, user, tutor);
      
      if (session) {
        setSessionId(session.id);
        setStep('payment');
        
        // Set up payment intent - don't force two-stage payment initially
        const result = await setupPayment({
          sessionId: session.id,
          amount: amount,
          tutor: tutor,
          user: user,
          forceTwoStage: false
        });
        
        // Set two-stage payment flag based on the result
        if (result && result.isTwoStagePayment !== undefined) {
          setIsTwoStagePayment(result.isTwoStagePayment);
        }
      }
    } finally {
      setCreatingSession(false);
    }
  }, [user, tutor, calculatePaymentAmount, createSession, setupPayment, setStep, 
      setSessionId, setCreatingSession, setSelectedSlot, setAuthRequired, 
      setIsTwoStagePayment, isLimited, markAttempt, setupInProgress]);
  
  // Handle payment completion
  const handlePaymentComplete = useCallback(() => {
    setStep('processing');
    
    // After a short delay, close the modal
    setTimeout(() => {
      onClose();
    }, 3000);
  }, [onClose, setStep]);
  
  // Handle cancellation
  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);
  
  // Retry payment setup
  const retryPaymentSetup = useCallback(() => {
    if (sessionId && selectedSlot && user && !setupInProgress()) {
      if (isLimited()) {
        return;
      }
      
      markAttempt();
      setCreatingSession(true);
      
      // Calculate amount again
      const hourlyRate = tutor.hourlyRate || 50;
      const amount = calculatePaymentAmount(selectedSlot, hourlyRate);
      
      // Try payment setup again with forceTwoStage=true as a fallback option
      setupPayment({
        sessionId: sessionId,
        amount: amount,
        tutor: tutor,
        user: user,
        forceTwoStage: true
      })
        .then(result => {
          // Set two-stage payment flag based on the result
          if (result && result.isTwoStagePayment !== undefined) {
            setIsTwoStagePayment(result.isTwoStagePayment);
          }
        })
        .finally(() => {
          setCreatingSession(false);
        });
    }
  }, [sessionId, selectedSlot, user, tutor, calculatePaymentAmount, setupPayment, 
      setCreatingSession, setIsTwoStagePayment, isLimited, markAttempt, setupInProgress]);
  
  return {
    user,
    step,
    selectedSlot,
    sessionId,
    creatingSession: creatingSession || isProcessing,
    authRequired,
    clientSecret,
    paymentAmount,
    paymentError,
    isTwoStagePayment,
    handleSlotSelect,
    handlePaymentComplete,
    handleCancel,
    setAuthRequired,
    retryPaymentSetup,
    isProcessing
  };
}

/**
 * Hook for resetting the session when the modal is closed
 */
function useSessionReset(
  isOpen: boolean,
  resetBookingFlow: () => void,
  setSelectedSlot: (slot: BookingSlot | null) => void,
  setSessionId: (id: string | null) => void, 
  resetPaymentSetup: () => void,
  setCreatingSession: (creating: boolean) => void
) {
  useState(() => {
    if (!isOpen) {
      setTimeout(() => {
        resetBookingFlow();
        setSelectedSlot(null);
        setSessionId(null);
        resetPaymentSetup();
        setCreatingSession(false);
      }, 300); // slight delay to avoid visual glitches
    }
  }, [isOpen, resetBookingFlow, setSelectedSlot, setSessionId, resetPaymentSetup, setCreatingSession]);
}
