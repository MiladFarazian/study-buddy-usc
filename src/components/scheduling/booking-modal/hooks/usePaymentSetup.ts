
import { useState, useCallback } from 'react';
import { BookingSlot } from '@/lib/scheduling/types';
import { Tutor } from '@/types/tutor';
import { User } from '@supabase/supabase-js';
import { createPaymentIntent } from '@/lib/stripe-utils';
import { toast } from 'sonner';

/**
 * Hook for setting up payment intents for booking
 */
export function usePaymentSetup() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  /**
   * Set up a payment intent for a session
   */
  const setupPayment = useCallback(async (
    sessionId: string, 
    amount: number,
    tutor: Tutor,
    user: User | null
  ) => {
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
    }
  }, []);
  
  return {
    clientSecret,
    setClientSecret,
    paymentAmount,
    setPaymentAmount,
    paymentError,
    setPaymentError,
    setupPayment
  };
}
