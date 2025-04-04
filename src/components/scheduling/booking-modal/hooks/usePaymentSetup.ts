
import { useState, useCallback, useRef } from 'react';
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
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Use ref to prevent multiple simultaneous requests
  const requestInProgress = useRef<boolean>(false);
  
  // Track the last session ID to avoid duplicate requests
  const lastSessionId = useRef<string | null>(null);
  
  /**
   * Set up a payment intent for a session with improved error handling
   */
  const setupPayment = useCallback(async (
    sessionId: string, 
    amount: number,
    tutor: Tutor,
    user: User | null,
    forceTwoStage: boolean = false // Make forceTwoStage an optional parameter with default value
  ) => {
    if (!user || !sessionId) {
      return { success: false };
    }
    
    // Check if this is a duplicate request for the same session
    if (sessionId === lastSessionId.current && clientSecret) {
      console.log('Payment setup already completed for this session, returning cached result');
      return { 
        success: true, 
        isTwoStagePayment 
      };
    }
    
    // Prevent multiple simultaneous requests
    if (requestInProgress.current) {
      console.log('Payment setup already in progress, skipping duplicate request');
      return { success: false, alreadyInProgress: true };
    }
    
    setPaymentError(null);
    requestInProgress.current = true;
    setIsProcessing(true);
    
    try {
      console.log(`Setting up payment for session ${sessionId} with amount ${amount}`);
      
      // Store session ID to track duplicates
      lastSessionId.current = sessionId;
      
      const paymentIntent = await createPaymentIntent(
        sessionId,
        amount,
        tutor.id,
        user.id,
        `Tutoring session with ${tutor.name || tutor.firstName + ' ' + tutor.lastName} (${sessionId})`,
        forceTwoStage // Use the parameter
      );
      
      if (paymentIntent) {
        console.log('Payment intent created successfully:', paymentIntent);
        setClientSecret(paymentIntent.client_secret);
        setPaymentAmount(amount);
        setIsTwoStagePayment(!!paymentIntent.two_stage_payment);
        
        requestInProgress.current = false;
        setIsProcessing(false);
        return { 
          success: true, 
          isTwoStagePayment: !!paymentIntent.two_stage_payment 
        };
      } else {
        throw new Error('Empty response from payment intent creation');
      }
    } catch (error: any) {
      console.error('Payment setup error:', error);
      
      // Enhanced error detection for network/connection issues
      const isNetworkError = error.message && (
        error.message.includes('Failed to fetch') ||
        error.message.includes('Failed to send') ||
        error.message.includes('network') ||
        error.message.includes('Network Error')
      );
      
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
          // Force two-stage payment
          const retryResult = await createPaymentIntent(
            sessionId,
            amount,
            tutor.id,
            user.id,
            `Tutoring session with ${tutor.name || tutor.firstName + ' ' + tutor.lastName} (${sessionId})`,
            true // Force two-stage payment
          );
          
          if (retryResult) {
            console.log('Created two-stage payment intent as fallback:', retryResult);
            setClientSecret(retryResult.client_secret);
            setPaymentAmount(amount);
            setIsTwoStagePayment(true);
            
            requestInProgress.current = false;
            setIsProcessing(false);
            return { 
              success: true, 
              isTwoStagePayment: true
            };
          }
        } catch (retryError: any) {
          console.error('Retry payment setup error:', retryError);
          setPaymentError('Could not set up payment. Please try again in a moment.');
        }
      } else if (error.message && error.message.includes('rate limit') || 
                 error.message && error.message.includes('429') ||
                 isNetworkError) {
        setPaymentError('Too many payment requests or network connectivity issue. Please wait a moment and try again.');
        
        // Set a reasonable delay to prevent overwhelming the API
        const retryDelay = Math.min(2000 * Math.pow(2, retryCount), 10000); // Max 10 seconds
        console.log(`Will retry automatically after ${retryDelay}ms`);
        
        // Auto-retry after delay
        setTimeout(() => {
          console.log('Attempting automatic retry...');
          setRetryCount(prev => prev + 1);
          requestInProgress.current = false;
          // We'll call setupPayment again from the component
        }, retryDelay);
      } else {
        // Handle other errors
        setPaymentError(error.message || 'Could not set up payment. Please try again.');
      }
      
      requestInProgress.current = false;
      setIsProcessing(false);
      return { success: false };
    }
  }, [retryCount, clientSecret, isTwoStagePayment]);
  
  // Reset all state
  const resetPaymentSetup = useCallback(() => {
    setClientSecret(null);
    setPaymentAmount(0);
    setPaymentError(null);
    setIsTwoStagePayment(false);
    setRetryCount(0);
    requestInProgress.current = false;
    lastSessionId.current = null;
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
    setupPayment,
    retryCount,
    resetPaymentSetup,
    isProcessing
  };
}
