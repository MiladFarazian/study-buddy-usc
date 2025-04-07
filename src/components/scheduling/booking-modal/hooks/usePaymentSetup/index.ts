
import { useCallback } from 'react';
import { usePaymentState } from './usePaymentState';
import { useRateLimiting } from './useRateLimiting';
import { setupPaymentHandler } from './setupPaymentHandler';
import { SetupPaymentParams, PaymentSetupResult } from './types';
import { toast } from 'sonner';

/**
 * Hook for setting up payment intents for booking
 */
export function usePaymentSetup() {
  const {
    clientSecret,
    paymentAmount,
    paymentError,
    isTwoStagePayment,
    retryCount,
    isProcessing,
    setClientSecret,
    setPaymentAmount,
    setPaymentError,
    setIsTwoStagePayment,
    setIsProcessing,
    incrementRetryCount,
    resetState
  } = usePaymentState();
  
  const {
    checkRateLimit,
    startRequest,
    endRequest,
    resetLimiting,
    getLastSessionId
  } = useRateLimiting();
  
  /**
   * Set up a payment intent for a session with improved error handling
   */
  const setupPayment = useCallback(async ({
    sessionId,
    amount,
    tutor,
    user,
    forceTwoStage = false
  }: SetupPaymentParams): Promise<PaymentSetupResult> => {
    console.log(`setupPayment called with sessionId=${sessionId}, amount=${amount}, forceTwoStage=${forceTwoStage}`);
    
    const { canProceed, isDuplicate, timeSinceLastRequest } = checkRateLimit(sessionId);
    
    if (!canProceed) {
      console.log(`Request too soon after previous request (${timeSinceLastRequest}ms). Enforcing client-side rate limit.`);
      toast.warning("Please wait a moment before trying again");
      return { success: false, alreadyInProgress: true };
    }
    
    // Check if this is a duplicate request for the same session
    if (isDuplicate && clientSecret) {
      console.log('Payment setup already completed for this session, returning cached result');
      toast.info("Using existing payment setup");
      return { 
        success: true, 
        isTwoStagePayment 
      };
    }
    
    // Start tracking this request
    startRequest(sessionId);
    
    try {
      const result = await setupPaymentHandler(
        { sessionId, amount, tutor, user, forceTwoStage },
        {
          setClientSecret,
          setPaymentAmount,
          setIsTwoStagePayment,
          setPaymentError,
          setIsProcessing,
          incrementRetryCount
        }
      );
      
      // If we need to retry with two-stage payment
      if (!result.success && result.retryWithTwoStage) {
        console.log("Retrying with two-stage payment");
        toast.info("Retrying with two-stage payment");
        
        // Instead of recursively calling, we'll try once with the two-stage flag
        const retryResult = await setupPaymentHandler(
          { sessionId, amount, tutor, user, forceTwoStage: true },
          {
            setClientSecret,
            setPaymentAmount,
            setIsTwoStagePayment,
            setPaymentError,
            setIsProcessing,
            incrementRetryCount
          }
        );
        
        return retryResult;
      }
      
      return result;
    } finally {
      // End request tracking
      endRequest();
    }
  }, [
    clientSecret,
    isTwoStagePayment,
    checkRateLimit,
    startRequest,
    endRequest,
    setClientSecret,
    setPaymentAmount,
    setIsTwoStagePayment,
    setPaymentError,
    setIsProcessing,
    incrementRetryCount
  ]);
  
  // Reset all state
  const resetPaymentSetup = useCallback(() => {
    resetState();
    resetLimiting();
  }, [resetState, resetLimiting]);
  
  return {
    clientSecret,
    setClientSecret,
    paymentAmount,
    setPaymentAmount,
    paymentError,
    setPaymentError,
    isTwoStagePayment,
    setIsTwoStagePayment,
    setupPayment,
    retryCount,
    resetPaymentSetup,
    isProcessing
  };
}

export * from './types';
