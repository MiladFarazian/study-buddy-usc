
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthState } from '@/hooks/useAuthState';
import { BookingSlot } from '@/lib/scheduling/types';
import { Tutor } from '@/types/tutor';
import { useSessionCreation } from './hooks/useSessionCreation';
import { usePaymentSetup } from './hooks/usePaymentSetup';
import { useSlotSelection } from './hooks/useSlotSelection';
import { useBookingFlow, BookingStep } from './hooks/useBookingFlow';
import { toast } from 'sonner';

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
  
  // Track if payment setup is in progress to prevent duplicate attempts
  const setupInProgress = useRef(false);
  
  // Reset the flow when the modal is closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        resetBookingFlow();
        setSelectedSlot(null);
        setSessionId(null);
        resetPaymentSetup();
        setCreatingSession(false);
        setupInProgress.current = false;
      }, 300); // slight delay to avoid visual glitches
    }
  }, [isOpen, resetBookingFlow, setSelectedSlot, setSessionId, resetPaymentSetup, setCreatingSession]);
  
  // Handle slot selection
  const handleSlotSelect = useCallback(async (slot: BookingSlot) => {
    if (!user) {
      setAuthRequired(true);
      return;
    }
    
    // Prevent multiple simultaneous calls
    if (setupInProgress.current) {
      console.log('Setup already in progress, ignoring request');
      return;
    }
    
    try {
      setupInProgress.current = true;
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
        
        // Set up payment intent
        const result = await setupPayment(session.id, amount, tutor, user);
        
        // Set two-stage payment flag based on the result
        if (result && result.isTwoStagePayment !== undefined) {
          setIsTwoStagePayment(result.isTwoStagePayment);
        }
        
        if (!result.success && !result.alreadyInProgress) {
          // Only show error toast if it's a genuine failure (not duplicate request)
          toast("Payment Setup Issue", {
            description: "There was a problem setting up payment. Please try again."
          });
        }
      } else {
        toast("Session Creation Failed", {
          description: "Could not create your booking session. Please try again."
        });
      }
    } catch (error) {
      console.error("Error in slot selection process:", error);
      toast("Error", {
        description: "Something went wrong. Please try again."
      });
    } finally {
      setCreatingSession(false);
      setupInProgress.current = false;
    }
  }, [user, tutor, calculatePaymentAmount, createSession, setupPayment, setStep, setSessionId, setCreatingSession, setSelectedSlot, setAuthRequired, setIsTwoStagePayment]);
  
  // Handle payment completion
  const handlePaymentComplete = useCallback(() => {
    setStep('processing');
    
    // After a short delay, close the modal
    setTimeout(() => {
      toast("Booking Successful", {
        description: "Your tutoring session has been booked successfully!"
      });
      onClose();
    }, 3000);
  }, [onClose, setStep]);
  
  // Handle cancellation
  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);
  
  // Retry payment setup with exponential backoff
  const retryPaymentSetup = useCallback(() => {
    if (sessionId && selectedSlot && user && !setupInProgress.current) {
      setupInProgress.current = true;
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
        })
        .catch(err => {
          console.error("Retry payment setup error:", err);
          toast("Retry Failed", {
            description: "Could not retry payment setup. Please try again later."
          });
        })
        .finally(() => {
          setCreatingSession(false);
          setupInProgress.current = false;
        });
    }
  }, [sessionId, selectedSlot, user, tutor, calculatePaymentAmount, setupPayment, setCreatingSession, setIsTwoStagePayment]);
  
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
