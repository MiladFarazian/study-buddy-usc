
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
  const [isTwoStagePayment, setIsTwoStagePayment] = useState<boolean>(false);
  
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
      return { success: false };
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
      setIsTwoStagePayment(!!paymentIntent.two_stage_payment);
      
      return { 
        success: true, 
        isTwoStagePayment: !!paymentIntent.two_stage_payment 
      };
    } catch (error: any) {
      console.error('Payment setup error:', error);
      
      // For Connect setup errors, we don't show an error anymore
      // as we'll use two-stage payments instead
      if (error.message && (
        error.message.includes('payment account') || 
        error.message.includes('Stripe Connect') ||
        error.message.includes('not completed') ||
        error.message.includes('not set up')
      )) {
        // Try again to create a two-stage payment intent
        try {
          // The server should now create a direct platform payment
          const retryResult = await createPaymentIntent(
            sessionId,
            amount,
            tutor.id,
            user.id,
            `Tutoring session with ${tutor.name} (${sessionId})`
          );
          
          setClientSecret(retryResult.client_secret);
          setPaymentAmount(amount);
          setIsTwoStagePayment(true);
          
          return { 
            success: true, 
            isTwoStagePayment: true
          };
        } catch (retryError: any) {
          console.error('Retry payment setup error:', retryError);
          setPaymentError(retryError.message || 'Could not set up payment. Please try again.');
          return { success: false };
        }
      } else if (error.message && error.message.includes('rate limit')) {
        setPaymentError('Too many payment requests. Please wait a moment and try again.');
      } else {
        setPaymentError(error.message || 'Could not set up payment. Please try again.');
      }
      
      return { success: false };
    }
  }, []);
  
  return {
    clientSecret,
    setClientSecret,
    paymentAmount,
    setPaymentAmount,
    paymentError,
    setPaymentError,
    isTwoStagePayment,
    setIsTwoStagePayment,
    setupPayment
  };
}
