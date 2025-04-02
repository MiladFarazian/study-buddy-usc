
import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { createPaymentIntent, processPayment, initializeStripe } from "@/lib/stripe-utils";
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling/types";

export function usePaymentForm({
  tutor,
  selectedSlot,
  sessionId,
  studentId,
  studentName,
  studentEmail,
  onPaymentComplete
}: {
  tutor: Tutor | null;
  selectedSlot: BookingSlot | null;
  sessionId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  onPaymentComplete: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [cardElement, setCardElement] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [stripe, setStripe] = useState<any>(null);
  const [retryTimeout, setRetryTimeout] = useState<number | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Use refs to track mounted state
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
  
  // Calculate session duration and cost
  const startTime = selectedSlot?.start ? new Date(`2000-01-01T${selectedSlot.start}`) : new Date();
  const endTime = selectedSlot?.end ? new Date(`2000-01-01T${selectedSlot.end}`) : new Date();
  const durationHours = selectedSlot?.start && selectedSlot?.end 
    ? (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60) 
    : 0;
  const hourlyRate = tutor?.hourlyRate || 25;
  const sessionCost = hourlyRate * durationHours;
  
  // Load Stripe.js
  useEffect(() => {    
    const loadStripe = async () => {
      try {
        const stripeInstance = await initializeStripe();
        if (isMounted.current) {
          setStripe(stripeInstance);
          setStripeLoaded(true);
        }
      } catch (error) {
        console.error('Error loading Stripe:', error);
        if (isMounted.current) {
          toast({
            title: 'Error',
            description: 'Failed to load payment processor. Please try again.',
            variant: 'destructive',
          });
        }
      }
    };
    
    loadStripe();
  }, [toast]);
  
  // Create payment intent when component mounts
  useEffect(() => {
    // Skip if not all required data is available
    if (!sessionId || !studentId || !tutor?.id || !stripeLoaded || 
        !selectedSlot?.day || !selectedSlot?.start || paymentAttempted.current || isRetrying) {
      if (!sessionId || !studentId || !tutor?.id || !stripeLoaded || !selectedSlot?.day || !selectedSlot?.start) {
        setLoading(false);
      }
      return;
    }
    
    const setupPayment = async () => {
      try {
        if (isMounted.current) {
          setLoading(true);
          setSetupError(null);
          // Mark that we've attempted payment to prevent multiple simultaneous attempts
          paymentAttempted.current = true;
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
          setLoading(false);
          paymentAttempted.current = false;
        }
      } catch (error) {
        console.error('Error setting up payment:', error);
        
        if (isMounted.current) {
          // Check if the error is related to rate limiting
          const isRateLimit = error.message && (
            error.message.includes("rate limit") || 
            error.message.includes("Rate limit") ||
            error.message.includes("Too many requests")
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
          } else if (error.message && (
            error.message.includes("payment account") || 
            error.message.includes("Stripe Connect") ||
            error.message.includes("not completed")
          )) {
            setSetupError("The tutor hasn't completed their payment account setup. Please try a different tutor or contact support.");
          } else {
            setSetupError(error.message || "Failed to set up payment");
            
            toast({
              title: 'Payment Setup Error',
              description: 'There was an issue setting up your payment. Please try again.',
              variant: 'destructive',
            });
          }
          
          setLoading(false);
          paymentAttempted.current = false;
        }
      }
    };
    
    if (sessionId && studentId && tutor?.id && stripeLoaded && selectedSlot?.day) {
      setupPayment();
    }
  }, [sessionId, studentId, tutor?.id, tutor?.name, selectedSlot, sessionCost, 
      toast, stripeLoaded, retryCount, isRetrying]);
  
  const handleCardElementReady = useCallback((element: any) => {
    setCardElement(element);
    
    // Add event listener for card errors
    element.on('change', (event: any) => {
      setCardError(event.error ? event.error.message : '');
    });
  }, []);
  
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !cardElement || !clientSecret) {
      toast({
        title: 'Payment Error',
        description: 'Payment system not fully loaded. Please try again.',
        variant: 'destructive',
      });
      return;
    }
    
    setProcessing(true);
    
    try {
      // Process the payment with Stripe
      const result = await processPayment(
        clientSecret,
        cardElement,
        studentName || 'Unknown Student',
        studentEmail || 'unknown@example.com'
      );
      
      toast({
        title: 'Payment Successful',
        description: 'Your session has been booked and payment processed.',
      });
      
      setPaymentComplete(true);
      onPaymentComplete();
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'There was an error processing your payment.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const retrySetupPayment = useCallback(() => {
    paymentAttempted.current = false;
    setRetryCount(prev => prev + 1);
    setSetupError(null);
    setLoading(true);
  }, []);
  
  return {
    loading,
    processing,
    paymentComplete,
    stripeLoaded,
    cardElement,
    clientSecret,
    cardError,
    sessionCost,
    setupError,
    isRetrying,
    handleCardElementReady,
    handleSubmitPayment,
    retrySetupPayment,
    setCardError,
  };
}
