
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
      // Update state before making the request
      setIsProcessing(true);
      
      if (amount > 0) {
        setPaymentAmount(amount);
      }
      
      // Remove the second argument that was causing the TS error - we'll update state directly here instead
      const result = await setupPaymentHandler({ 
        sessionId, 
        amount, 
        tutor, 
        user, 
        forceTwoStage 
      });
      
      // Update state based on the result
      if (result.success) {
        if (result.clientSecret) {
          setClientSecret(result.clientSecret);
        }
        if (result.isTwoStagePayment !== undefined) {
          setIsTwoStagePayment(result.isTwoStagePayment);
        }
        setPaymentError(null);
      } else {
        setPaymentError(result.error || "Unknown error occurred");
        incrementRetryCount();
      }
      
      // If we need to retry with two-stage payment
      if (!result.success && result.retryWithTwoStage) {
        console.log("Retrying with two-stage payment");
        toast.info("Retrying with two-stage payment");
        
        // Instead of recursively calling, we'll try once with the two-stage flag
        // Update state before making the retry request
        setIsProcessing(true);
        
        // Remove the second argument that was causing the TS error
        const retryResult = await setupPaymentHandler({
          sessionId, 
          amount, 
          tutor, 
          user, 
          forceTwoStage: true
        });
        
        // Update state based on the retry result
        if (retryResult.success) {
          if (retryResult.clientSecret) {
            setClientSecret(retryResult.clientSecret);
          }
          if (retryResult.isTwoStagePayment !== undefined) {
            setIsTwoStagePayment(retryResult.isTwoStagePayment);
          }
          setPaymentError(null);
        } else {
          setPaymentError(retryResult.error || "Unknown error during retry");
          incrementRetryCount();
        }
        
        return retryResult;
      }
      
      return result;
    } finally {
      // End request tracking and processing state
      endRequest();
      setIsProcessing(false);
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
