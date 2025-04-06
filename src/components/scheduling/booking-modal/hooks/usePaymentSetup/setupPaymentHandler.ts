
import { createPaymentIntent } from '@/lib/stripe-utils';
import { toast } from 'sonner';
import { SetupPaymentParams, PaymentSetupResult } from './types';

/**
 * Handle the payment setup process by creating a payment intent
 */
export async function setupPaymentHandler({
  sessionId,
  amount,
  tutor,
  user,
  forceTwoStage = false
}: SetupPaymentParams, {
  setClientSecret,
  setPaymentAmount,
  setIsTwoStagePayment,
  setPaymentError,
  setIsProcessing,
  incrementRetryCount
}: any): Promise<PaymentSetupResult> {
  console.log(`setupPaymentHandler called with sessionId=${sessionId}, amount=${amount}, forceTwoStage=${forceTwoStage}`);
  
  if (!user || !sessionId) {
    console.error("Missing user or sessionId in setupPayment");
    return { success: false };
  }
  
  setPaymentError(null);
  setIsProcessing(true);
  
  try {
    console.log(`Setting up payment for session ${sessionId} with amount ${amount}, forceTwoStage=${forceTwoStage}`);
    
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
      // Only retry if not already trying two-stage payment
      if (!forceTwoStage) {
        try {
          console.log("Creating two-stage payment as fallback due to Connect setup issue");
          
          // Try again with forceTwoStage=true
          return await setupPaymentHandler({
            sessionId,
            amount,
            tutor,
            user,
            forceTwoStage: true
          }, {
            setClientSecret,
            setPaymentAmount,
            setIsTwoStagePayment,
            setPaymentError,
            setIsProcessing,
            incrementRetryCount
          });
        } catch (retryError: any) {
          console.error('Retry payment setup error:', retryError);
          setPaymentError('Could not set up payment. Please try again in a moment.');
        }
      } else {
        setPaymentError('Two-stage payment creation failed. Please try again later.');
      }
    } else if (isRateLimitError || isNetworkError) {
      // Improve feedback message
      const errorMessage = isRateLimitError 
        ? 'Payment service is currently busy. Please wait a moment before trying again.' 
        : 'Network connectivity issue. Please check your connection and try again.';
        
      setPaymentError(errorMessage);
      
      // For better UX, show toast notification for rate limit errors
      if (isRateLimitError) {
        toast.error(errorMessage);
      }
      
      // We'll let the user retry manually
      incrementRetryCount();
    } else {
      // Handle other errors
      setPaymentError(error.message || 'Could not set up payment. Please try again.');
    }
    
    setIsProcessing(false);
    return { success: false };
  }
}
