
import { useState, useCallback } from 'react';
import { useRateLimiter } from '../useRateLimiter';
import { PaymentSetupParams, PaymentSetupResult } from './types';

/**
 * Hook for handling payment setup in the booking flow
 */
export function usePaymentSetup() {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentError, setPaymentError] = useState<string>('');
  const [isTwoStagePayment, setIsTwoStagePayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Use rate limiter with appropriate cooldown period
  const { isRateLimited, trackRequest } = useRateLimiter();

  /**
   * Set up a payment intent for the booking
   */
  const setupPayment = useCallback(async (params: PaymentSetupParams): Promise<PaymentSetupResult | null> => {
    if (isRateLimited()) {
      setPaymentError('Too many requests. Please try again in a few moments.');
      return null;
    }
    
    trackRequest();
    setIsProcessing(true);
    
    try {
      // In a real implementation, this would call an API to create a payment intent
      // For this demo, we'll simulate a successful payment setup
      const simulatedResult: PaymentSetupResult = {
        clientSecret: 'mock_intent_secret_' + Math.random().toString(36).substring(2, 10),
        isTwoStagePayment: params.forceTwoStage || Math.random() > 0.5,
        amount: params.amount
      };
      
      // Update state with the result
      setClientSecret(simulatedResult.clientSecret);
      setPaymentAmount(simulatedResult.amount);
      setIsTwoStagePayment(simulatedResult.isTwoStagePayment);
      setPaymentError('');
      
      return simulatedResult;
    } catch (error) {
      console.error('Error setting up payment:', error);
      setPaymentError(error instanceof Error ? error.message : 'Failed to set up payment');
      setRetryCount(prevCount => prevCount + 1);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [isRateLimited, trackRequest]);

  /**
   * Reset the payment setup state
   */
  const resetPaymentState = useCallback(() => {
    setClientSecret('');
    setPaymentAmount(0);
    setPaymentError('');
    setIsTwoStagePayment(false);
    setIsProcessing(false);
    setRetryCount(0);
  }, []);

  return {
    setupPayment,
    resetPaymentState,
    clientSecret,
    paymentAmount,
    paymentError,
    isTwoStagePayment,
    isProcessing,
    // Add the setter functions needed by useBookingSession
    setClientSecret,
    setPaymentAmount,
    setPaymentError, 
    setIsTwoStagePayment,
    resetPaymentSetup: resetPaymentState
  };
}
