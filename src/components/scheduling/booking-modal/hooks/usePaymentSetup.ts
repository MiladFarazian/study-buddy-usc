
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
  
  // Track the timestamp of the last request to implement client-side rate limiting
  const lastRequestTime = useRef<number>(0);
  const MIN_REQUEST_INTERVAL = 5000; // Increased to 5 seconds minimum between requests to avoid rate limits
  
  /**
   * Set up a payment intent for a session with improved error handling
   */
  const setupPayment = useCallback(async (
    sessionId: string, 
    amount: number,
    tutor: Tutor,
    user: User | null,
    forceTwoStage: boolean = false // Important parameter - explicitly defined
  ) => {
    console.log(`setupPayment called with sessionId=${sessionId}, amount=${amount}, forceTwoStage=${forceTwoStage}`);
    
    if (!user || !sessionId) {
      console.error("Missing user or sessionId in setupPayment");
      return { success: false };
    }
    
    // First check for too frequent requests (client-side rate limiting)
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      console.log(`Request too soon after previous request (${timeSinceLastRequest}ms). Enforcing client-side rate limit.`);
      return { success: false, alreadyInProgress: true };
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
    lastRequestTime.current = now;
    
    try {
      console.log(`Setting up payment for session ${sessionId} with amount ${amount}, forceTwoStage=${forceTwoStage}`);
      
      // Store session ID to track duplicates
      lastSessionId.current = sessionId;
      
      // Detect if we're in a production environment
      const isProduction = window.location.hostname === 'studybuddyusc.com' ||
                        window.location.hostname.includes('netlify') ||
                        window.location.hostname.includes('vercel');
                        
      console.log(`Detected environment: ${isProduction ? 'PRODUCTION' : 'DEV/TEST'}`);
      
      // Create payment intent with explicit forceTwoStage parameter and production flag
      const paymentIntent = await createPaymentIntent(
        sessionId,
        amount,
        tutor.id,
        user.id,
        `Tutoring session with ${tutor.name || tutor.firstName + ' ' + tutor.lastName} (${sessionId})`,
        forceTwoStage, 
        isProduction // Pass the environment detection to createPaymentIntent
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
      
      // Better rate limit error detection
      const isRateLimitError = error.message && (
        error.message.includes('rate limit') ||
        error.message.includes('Rate limit') ||
        error.message.includes('Too many requests') ||
        error.message.includes('429')
      );
      
      // For Connect setup errors, try with two-stage payments
      if (error.message && (
        error.message.includes('payment account') || 
        error.message.includes('Stripe Connect') ||
        error.message.includes('not completed') ||
        error.message.includes('not set up')
      )) {
        // Try again to create a two-stage payment intent
        try {
          // Only retry if not already trying two-stage payment
          if (!forceTwoStage) {
            console.log("Creating two-stage payment as fallback due to Connect setup issue");
            // Force two-stage payment for the retry
            const retryResult = await createPaymentIntent(
              sessionId,
              amount,
              tutor.id,
              user.id,
              `Tutoring session with ${tutor.name || tutor.firstName + ' ' + tutor.lastName} (${sessionId})`,
              true, // Force two-stage payment
              window.location.hostname === 'studybuddyusc.com' // Pass production flag again
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
          } else {
            throw new Error('Two-stage payment creation failed');
          }
        } catch (retryError: any) {
          console.error('Retry payment setup error:', retryError);
          setPaymentError('Could not set up payment. Please try again in a moment.');
        }
      } else if (isRateLimitError || isNetworkError) {
        // Improve feedback message
        const errorMessage = isRateLimitError 
          ? 'Payment service is currently busy. Please wait a moment before trying again.' 
          : 'Network connectivity issue. Please check your connection and try again.';
          
        setPaymentError(errorMessage);
        
        // Exponential backoff with a maximum delay
        const retryDelay = Math.min(5000 * Math.pow(1.5, retryCount), 20000); // Max 20 seconds, starting higher
        console.log(`Will retry automatically after ${retryDelay}ms (attempt ${retryCount + 1})`);
        
        // Allow for a new request after the delay
        setTimeout(() => {
          requestInProgress.current = false;
        }, retryDelay);
        
        // We'll let the user retry manually rather than auto-retry
        setRetryCount(prev => prev + 1);
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
    lastRequestTime.current = 0;
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
