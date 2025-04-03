
import { useState, useEffect, useCallback, useRef } from "react";
import { initializeStripe } from "@/lib/stripe-utils";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook for initializing Stripe and handling retry logic
 */
export function useStripeInitialization() {
  const { toast } = useToast();
  const [stripe, setStripe] = useState<any>(null);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [initAttempt, setInitAttempt] = useState<number>(0);
  const [isInitRetrying, setIsInitRetrying] = useState<boolean>(false);
  const [retryTimeout, setRetryTimeout] = useState<number | null>(null);
  
  // Use ref to track mounted state
  const isMounted = useRef(true);
  
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
  
  // Load Stripe.js
  useEffect(() => {    
    if (retryTimeout) {
      clearTimeout(retryTimeout);
    }
    
    if (isInitRetrying) {
      return;
    }
    
    const loadStripe = async () => {
      try {
        console.log("Initializing Stripe...");
        setLoading(true);
        setInitError(null);
        
        const stripeInstance = await initializeStripe();
        
        if (!isMounted.current) return;
        
        if (!stripeInstance) {
          console.error('Failed to initialize Stripe');
          setInitError('Failed to initialize payment processor. Please refresh and try again.');
          setLoading(false);
          return;
        }
        
        console.log('Stripe loaded successfully');
        setStripe(stripeInstance);
        setStripeLoaded(true);
        setLoading(false);
      } catch (error: any) {
        console.error('Error loading Stripe:', error);
        if (isMounted.current) {
          const isRateLimit = error.message && (
            error.message.includes("rate limit") || 
            error.message.includes("Rate limit") ||
            error.message.includes("Too many requests")
          );
          
          if (isRateLimit && initAttempt < 3) {
            const retryDelay = Math.min(2000 * Math.pow(2, initAttempt), 10000);
            
            setInitError(`Payment system is temporarily busy. Will retry in ${Math.ceil(retryDelay/1000)} seconds.`);
            setIsInitRetrying(true);
            
            const timeoutId = window.setTimeout(() => {
              if (isMounted.current) {
                setInitAttempt(prev => prev + 1);
                setIsInitRetrying(false);
              }
            }, retryDelay);
            
            setRetryTimeout(timeoutId);
          } else {
            setInitError('Failed to load payment processor. Please try again later.');
            toast({
              title: 'Payment Error',
              description: 'Failed to load payment processor. Please try again.',
              variant: 'destructive',
            });
          }
          setLoading(false);
        }
      }
    };

    loadStripe();
  }, [toast, initAttempt, isInitRetrying]);
  
  const retryInitialization = useCallback(() => {
    setInitAttempt(prev => prev + 1);
    setIsInitRetrying(false);
  }, []);
  
  return {
    stripe,
    stripeLoaded,
    loading,
    initError,
    isInitRetrying,
    retryInitialization
  };
}
