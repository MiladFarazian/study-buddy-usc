
import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { findExistingPaymentIntent, createPaymentIntent } from "@/lib/stripe-utils";
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling/types";
import { format } from "date-fns";

/**
 * Hook for handling payment intents with error handling and retry logic
 */
export function usePaymentIntent({
  sessionId,
  studentId,
  tutor,
  selectedSlot,
  sessionCost,
  stripeLoaded
}: {
  sessionId: string | null;
  studentId: string | null;
  tutor: Tutor | null;
  selectedSlot: BookingSlot | null;
  sessionCost: number;
  stripeLoaded: boolean;
}) {
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryTimeout, setRetryTimeout] = useState<number | null>(null);
  
  // Use ref to track mounted state
  const isMounted = useRef(true);
  const paymentAttempted = useRef(false);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      // Clear any timeout on unmount
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [retryTimeout]);
  
  // Create payment intent
  useEffect(() => {
    // Skip if not all required data is available
    if (!sessionId || !studentId || !tutor?.id || !stripeLoaded || 
        !selectedSlot?.day || !selectedSlot?.start || paymentAttempted.current || isRetrying) {
      return;
    }
    
    const setupPayment = async () => {
      try {
        if (isMounted.current) {
          setSetupError(null);
          setErrorCode(null);
          // Mark that we've attempted payment to prevent multiple simultaneous attempts
          paymentAttempted.current = true;
        }
        
        // First check if there's an existing payment intent for this session
        const existingIntent = await findExistingPaymentIntent(sessionId);
        if (existingIntent && existingIntent.client_secret) {
          console.log("Found existing payment intent:", existingIntent);
          if (isMounted.current) {
            setClientSecret(existingIntent.client_secret);
            paymentAttempted.current = false;
            return;
          }
        }
        
        // Validate required parameters
        if (!tutor?.id) {
          throw new Error("Tutor information is missing");
        }
        
        if (!sessionId) {
          throw new Error("Session ID is missing");
        }
        
        if (!studentId) {
          throw new Error("Student ID is missing");
        }
        
        if (!selectedSlot?.day || !selectedSlot?.start) {
          throw new Error("Booking time information is incomplete");
        }
        
        if (isNaN(sessionCost) || sessionCost <= 0) {
          throw new Error("Invalid session cost");
        }
        
        // Create a payment intent with Stripe
        const formattedDate = format(new Date(selectedSlot.day), 'MMM dd, yyyy');
        const description = `Tutoring session with ${tutor.name} on ${formattedDate} at ${selectedSlot.start}`;
        
        console.log("Creating payment intent:", {
          sessionId, sessionCost, tutorId: tutor.id, studentId, description
        });
        
        const paymentIntent = await createPaymentIntent(
          sessionId,
          sessionCost,
          tutor.id,
          studentId,
          description
        );
        
        if (!paymentIntent || !paymentIntent.client_secret) {
          throw new Error("Failed to create payment intent. Please try again later.");
        }
        
        console.log("Received payment intent:", paymentIntent);
        
        if (isMounted.current) {
          setClientSecret(paymentIntent.client_secret);
          paymentAttempted.current = false;
        }
      } catch (error: any) {
        console.error('Error setting up payment:', error);
        
        if (isMounted.current) {
          // Check for specific error codes
          const errorData = error.message && error.message.includes('{') 
            ? JSON.parse(error.message.substring(error.message.indexOf('{')))
            : null;
            
          const errorCode = errorData?.code || null;
          setErrorCode(errorCode);
          
          // Check if the error is related to rate limiting
          const isRateLimit = errorCode === 'rate_limited' || error.message && (
            error.message.includes("rate limit") || 
            error.message.includes("Rate limit") ||
            error.message.includes("Too many requests")
          );
          
          // Check if the error is related to Connect account setup
          const isConnectNotSetup = errorCode === 'connect_not_setup' || error.message && (
            error.message.includes("payment account") ||
            error.message.includes("not set up")
          );
          
          const isConnectIncomplete = errorCode === 'connect_incomplete' || error.message && (
            error.message.includes("not completed") ||
            error.message.includes("incomplete")
          );
          
          const isConnectVerification = errorCode === 'connect_verification_required' || error.message && (
            error.message.includes("verification")
          );
          
          if (isRateLimit) {
            setSetupError("Payment system is temporarily busy. We'll retry automatically in a few seconds.");
            // Set a timeout to retry after a delay, with exponential backoff
            const retryDelay = Math.min(2000 * Math.pow(2, retryCount), 16000); // Max 16 seconds
            
            const timeoutId = window.setTimeout(() => {
              if (isMounted.current) {
                setIsRetrying(false);
                paymentAttempted.current = false;
                setRetryCount(prev => prev + 1);
              }
            }, retryDelay);
            
            setRetryTimeout(timeoutId);
            setIsRetrying(true);
          } else if (isConnectNotSetup) {
            setSetupError("The tutor hasn't set up their payment account yet. Please try a different tutor or contact support.");
            toast({
              title: 'Tutor Payment Account Not Set Up',
              description: 'This tutor has not set up their payment account yet. Please try another tutor.',
              variant: 'destructive',
            });
          } else if (isConnectIncomplete) {
            setSetupError("The tutor hasn't completed their payment account setup. Please try a different tutor or contact support.");
            toast({
              title: 'Tutor Payment Setup Incomplete',
              description: 'This tutor has not completed their payment account setup. Please try another tutor.',
              variant: 'destructive',
            });
          } else if (isConnectVerification) {
            setSetupError("The tutor's payment account requires verification. Please try a different tutor or contact support.");
            toast({
              title: 'Tutor Account Requires Verification',
              description: 'This tutor\'s payment account requires verification. Please try another tutor.',
              variant: 'destructive',
            });
          } else {
            setSetupError(error.message || "Failed to set up payment");
            
            toast({
              title: 'Payment Setup Error',
              description: 'There was an issue setting up your payment. Please try again.',
              variant: 'destructive',
            });
          }
          
          paymentAttempted.current = false;
        }
      }
    };
    
    if (sessionId && studentId && tutor?.id && stripeLoaded && selectedSlot?.day) {
      console.log("All requirements met, setting up payment...");
      setupPayment();
    }
  }, [sessionId, studentId, tutor?.id, tutor?.name, selectedSlot, sessionCost, 
      toast, stripeLoaded, retryCount, isRetrying]);
  
  const retrySetupPayment = useCallback(() => {
    paymentAttempted.current = false;
    setRetryCount(prev => prev + 1);
    setSetupError(null);
    setErrorCode(null);
  }, []);
  
  return {
    clientSecret,
    setupError,
    errorCode,
    isRetrying,
    retrySetupPayment
  };
}
