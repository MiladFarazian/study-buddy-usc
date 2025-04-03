
import { useState, useEffect, useCallback } from 'react';
import { useAuthState } from '@/hooks/useAuthState';
import { BookingSlot } from '@/lib/scheduling/types';
import { Tutor } from '@/types/tutor';
import { useSessionCreation } from './hooks/useSessionCreation';
import { usePaymentSetup } from './hooks/usePaymentSetup';
import { useSlotSelection } from './hooks/useSlotSelection';
import { useBookingFlow, BookingStep } from './hooks/useBookingFlow';

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
    setupPayment
  } = usePaymentSetup();
  
  // Reset the flow when the modal is closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        resetBookingFlow();
        setSelectedSlot(null);
        setSessionId(null);
        setClientSecret(null);
        setPaymentError(null);
        setCreatingSession(false);
        setIsTwoStagePayment(false);
      }, 300); // slight delay to avoid visual glitches
    }
  }, [isOpen, resetBookingFlow, setSelectedSlot, setSessionId, setClientSecret, setPaymentError, setCreatingSession, setIsTwoStagePayment]);
  
  // Handle slot selection
  const handleSlotSelect = useCallback(async (slot: BookingSlot) => {
    if (!user) {
      setAuthRequired(true);
      return;
    }
    
    setSelectedSlot(slot);
    
    // Calculate payment amount (hourly rate prorated by duration)
    const hourlyRate = tutor.hourlyRate || 50; // default to $50 if not set
    const amount = calculatePaymentAmount(slot, hourlyRate);
    
    // Create a new session
    const session = await createSession(slot, user, tutor);
    
    if (session) {
      setSessionId(session.id);
      setStep('payment');
      
      // Set up payment intent
      const result = await setupPayment(session.id, amount, tutor, user);
      setCreatingSession(false);
      
      // Set two-stage payment flag based on the result
      if (result && result.isTwoStagePayment !== undefined) {
        setIsTwoStagePayment(result.isTwoStagePayment);
      }
    }
  }, [user, tutor, calculatePaymentAmount, createSession, setupPayment, setStep, setSessionId, setCreatingSession, setSelectedSlot, setAuthRequired, setIsTwoStagePayment]);
  
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
    if (sessionId && selectedSlot && user) {
      setCreatingSession(true);
      
      // Calculate amount again
      const hourlyRate = tutor.hourlyRate || 50;
      const amount = calculatePaymentAmount(selectedSlot, hourlyRate);
      
      // Try payment setup again
      setupPayment(sessionId, amount, tutor, user)
        .then(result => {
          // Set two-stage payment flag based on the result
          if (result && result.isTwoStagePayment !== undefined) {
            setIsTwoStagePayment(result.isTwoStagePayment);
          }
          setCreatingSession(false);
        })
        .catch(() => {
          setCreatingSession(false);
        });
    }
  }, [sessionId, selectedSlot, user, tutor, calculatePaymentAmount, setupPayment, setCreatingSession, setIsTwoStagePayment]);
  
  return {
    user,
    step,
    selectedSlot,
    sessionId,
    creatingSession,
    authRequired,
    clientSecret,
    paymentAmount,
    paymentError,
    isTwoStagePayment,
    handleSlotSelect,
    handlePaymentComplete,
    handleCancel,
    setAuthRequired,
    retryPaymentSetup
  };
}
