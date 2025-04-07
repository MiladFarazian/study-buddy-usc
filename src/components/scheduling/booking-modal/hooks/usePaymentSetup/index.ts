
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PaymentSetupResult, SetupPaymentParams, PaymentSetupState } from "./types";
import { useRateLimiter } from "../useRateLimiter";
import { toast } from "sonner";

// Initial state for the payment setup
const initialState: PaymentSetupState = {
  clientSecret: null,
  paymentAmount: 0,
  paymentError: null,
  isTwoStagePayment: false,
  isProcessing: false,
  retryCount: 0
};

/**
 * Hook for setting up payment intent for a tutoring session
 */
export function usePaymentSetup() {
  const [state, setState] = useState<PaymentSetupState>(initialState);
  const { isRateLimited, trackRequest } = useRateLimiter('payment-setup', 1500); // 1.5 second cooldown

  /**
   * Sets up a payment intent by calling the Supabase Edge Function
   */
  const setupPayment = useCallback(async (params: SetupPaymentParams): Promise<PaymentSetupResult> => {
    // Prevent duplicate requests
    if (state.isProcessing) {
      console.log('Payment setup already in progress, skipping duplicate request');
      return {
        success: false,
        alreadyInProgress: true,
        error: 'Payment setup already in progress'
      };
    }

    // Check rate limiting
    if (isRateLimited()) {
      console.log('Rate limited, skipping request');
      toast.error("Please wait before trying again.");
      return {
        success: false,
        error: 'Too many requests, please wait before trying again'
      };
    }

    trackRequest();
    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      console.log(`Setting up payment for session ${params.sessionId} with amount ${params.amount}`);
      
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          sessionId: params.sessionId,
          amount: params.amount,
          forceTwoStage: params.forceTwoStage || false,
        },
      });

      if (error) {
        console.error('Error setting up payment:', error);
        setState(prev => ({ 
          ...prev, 
          isProcessing: false,
          paymentError: error.message
        }));
        
        return {
          success: false,
          error: `Error setting up payment: ${error.message}`
        };
      }

      if (!data || !data.clientSecret) {
        console.error('Invalid response from payment setup:', data);
        setState(prev => ({ 
          ...prev, 
          isProcessing: false,
          paymentError: 'Invalid response from payment setup'
        }));
        
        return {
          success: false,
          error: 'Invalid response from payment setup'
        };
      }

      // Store client secret in state
      setState(prev => ({
        ...prev,
        clientSecret: data.clientSecret,
        paymentAmount: params.amount,
        isTwoStagePayment: data.isTwoStagePayment || false,
        isProcessing: false,
        paymentError: null
      }));

      return {
        success: true,
        clientSecret: data.clientSecret,
        isTwoStagePayment: data.isTwoStagePayment || false
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error setting up payment:', err);
      
      setState(prev => ({ 
        ...prev, 
        isProcessing: false,
        paymentError: errorMsg
      }));
      
      return {
        success: false,
        error: errorMsg
      };
    }
  }, [state.isProcessing, isRateLimited, trackRequest]);

  const resetPaymentState = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    setupPayment,
    resetPaymentState,
    clientSecret: state.clientSecret,
    paymentAmount: state.paymentAmount,
    paymentError: state.paymentError,
    isTwoStagePayment: state.isTwoStagePayment,
    isProcessing: state.isProcessing
  };
}
