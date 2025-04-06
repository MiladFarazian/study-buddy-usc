
import { useState } from 'react';
import { PaymentSetupState } from './types';

/**
 * Custom hook to manage payment-related state
 */
export function usePaymentState() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isTwoStagePayment, setIsTwoStagePayment] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  const incrementRetryCount = () => setRetryCount(prev => prev + 1);
  
  const resetState = () => {
    setClientSecret(null);
    setPaymentAmount(0);
    setPaymentError(null);
    setIsTwoStagePayment(false);
    setRetryCount(0);
    setIsProcessing(false);
  };
  
  const getCurrentState = (): PaymentSetupState => ({
    clientSecret,
    paymentAmount,
    paymentError,
    isTwoStagePayment,
    retryCount,
    isProcessing
  });
  
  return {
    // State values
    clientSecret,
    paymentAmount,
    paymentError,
    isTwoStagePayment, 
    retryCount,
    isProcessing,
    
    // State setters
    setClientSecret,
    setPaymentAmount,
    setPaymentError,
    setIsTwoStagePayment,
    setIsProcessing,
    incrementRetryCount,
    
    // Helpers
    resetState,
    getCurrentState
  };
}
