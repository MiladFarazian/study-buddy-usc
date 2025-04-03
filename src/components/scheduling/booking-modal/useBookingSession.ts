
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthState } from '@/hooks/useAuthState';
import { BookingSlot } from '@/lib/scheduling/types';
import { Tutor } from '@/types/tutor';
import { createPaymentIntent } from '@/lib/stripe-utils';
import { toast } from 'sonner';

type BookingStep = 'select-slot' | 'payment' | 'processing';

export function useBookingSession(tutor: Tutor, isOpen: boolean, onClose: () => void) {
  const { user } = useAuthState();
  const [step, setStep] = useState<BookingStep>('select-slot');
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  
  // Payment related states
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  // Reset the flow when the modal is closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('select-slot');
        setSelectedSlot(null);
        setSessionId(null);
        setClientSecret(null);
        setPaymentError(null);
        setCreatingSession(false);
      }, 300); // slight delay to avoid visual glitches
    }
  }, [isOpen]);
  
  // Create a session when a slot is selected and set up payment
  const createSession = useCallback(async (slot: BookingSlot) => {
    if (!user) {
      setAuthRequired(true);
      return null;
    }
    
    setCreatingSession(true);
    
    try {
      // Create the session in the database
      const { data: session, error } = await supabase
        .from('sessions')
        .insert({
          tutor_id: tutor.id,
          student_id: user.id,
          start_time: slot.startTime,
          end_time: slot.endTime,
          duration_minutes: slot.durationMinutes,
          status: 'pending',
          payment_status: 'pending'
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating session:', error);
        toast.error('Could not create session. Please try again.');
        setCreatingSession(false);
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('Exception creating session:', error);
      toast.error('An unexpected error occurred. Please try again.');
      setCreatingSession(false);
      return null;
    }
  }, [user, tutor]);
  
  // Set up payment intent
  const setupPayment = useCallback(async (sessionId: string, amount: number) => {
    if (!user || !sessionId) {
      return;
    }
    
    setPaymentError(null);
    
    try {
      const paymentIntent = await createPaymentIntent(
        sessionId,
        amount,
        tutor.id,
        user.id,
        `Tutoring session with ${tutor.name} (${sessionId})`
      );
      
      setClientSecret(paymentIntent.client_secret);
      setPaymentAmount(amount);
      setCreatingSession(false);
    } catch (error: any) {
      console.error('Payment setup error:', error);
      
      // Handle specific error cases
      if (error.message && (
        error.message.includes('payment account') || 
        error.message.includes('Stripe Connect') ||
        error.message.includes('not completed') ||
        error.message.includes('not set up')
      )) {
        setPaymentError(`Tutor's payment account setup is incomplete. Please try another tutor or contact support.`);
      } else if (error.message && error.message.includes('rate limit')) {
        setPaymentError('Too many payment requests. Please wait a moment and try again.');
      } else {
        setPaymentError(error.message || 'Could not set up payment. Please try again.');
      }
      
      setCreatingSession(false);
    }
  }, [user, tutor]);
  
  // Handle slot selection
  const handleSlotSelect = useCallback(async (slot: BookingSlot) => {
    if (!user) {
      setAuthRequired(true);
      return;
    }
    
    setSelectedSlot(slot);
    
    // Calculate payment amount (hourly rate prorated by duration)
    const hourlyRate = tutor.hourlyRate || 50; // default to $50 if not set
    const hours = slot.durationMinutes / 60;
    const amount = hourlyRate * hours;
    
    // Create a new session
    const session = await createSession(slot);
    
    if (session) {
      setSessionId(session.id);
      setStep('payment');
      
      // Set up payment intent
      await setupPayment(session.id, amount);
    }
  }, [user, tutor, createSession, setupPayment]);
  
  // Handle payment completion
  const handlePaymentComplete = useCallback(() => {
    setStep('processing');
    toast.success('Payment successful! Your session is now confirmed.');
    
    // After a short delay, close the modal
    setTimeout(() => {
      onClose();
    }, 3000);
  }, [onClose]);
  
  // Handle cancellation
  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);
  
  // Retry payment setup
  const retryPaymentSetup = useCallback(() => {
    if (sessionId && selectedSlot) {
      setCreatingSession(true);
      
      // Calculate amount again
      const hourlyRate = tutor.hourlyRate || 50;
      const hours = selectedSlot.durationMinutes / 60;
      const amount = hourlyRate * hours;
      
      // Try payment setup again
      setupPayment(sessionId, amount);
    }
  }, [sessionId, selectedSlot, tutor, setupPayment]);
  
  return {
    user,
    step,
    selectedSlot,
    creatingSession,
    authRequired,
    clientSecret,
    paymentAmount,
    paymentError,
    handleSlotSelect,
    handlePaymentComplete,
    handleCancel,
    setAuthRequired,
    retryPaymentSetup
  };
}
