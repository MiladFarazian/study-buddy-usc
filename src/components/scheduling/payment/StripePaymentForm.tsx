import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, RefreshCcw, CheckCircle } from "lucide-react";
import { initializeStripe } from "@/lib/stripe-utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StripePaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
  processing: boolean;
}

export function StripePaymentForm({
  clientSecret,
  amount,
  onSuccess,
  onCancel,
  processing
}: StripePaymentFormProps) {
  const { toast } = useToast();
  const [stripe, setStripe] = useState<any>(null);
  const [elements, setElements] = useState<any>(null);
  const [cardElement, setCardElement] = useState<any>(null);
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [initAttempt, setInitAttempt] = useState<number>(0);
  const [isInitRetrying, setIsInitRetrying] = useState<boolean>(false);
  const [retryTimeout, setRetryTimeout] = useState<number | null>(null);
  const [stripeReady, setStripeReady] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    
    if (retryTimeout) {
      clearTimeout(retryTimeout);
    }
    
    if (isInitRetrying) {
      return;
    }
    
    const loadStripe = async () => {
      try {
        console.log('Loading Stripe.js...');
        setLoading(true);
        setInitError(null);
        
        const stripeInstance = await initializeStripe();
        
        if (!mounted) return;
        
        if (!stripeInstance) {
          console.error('Failed to initialize Stripe');
          setInitError('Failed to initialize payment processor. Please refresh and try again.');
          setLoading(false);
          return;
        }
        
        console.log('Stripe loaded successfully');
        setStripe(stripeInstance);
        setStripeReady(true);
        setLoading(false);
      } catch (error: any) {
        console.error('Error loading Stripe:', error);
        if (mounted) {
          const isRateLimit = error.message && (
            error.message.includes("rate limit") || 
            error.message.includes("Rate limit") ||
            error.message.includes("Too many requests")
          );
          
          if (isRateLimit && initAttempt < 3) {
            const retryDelay = Math.min(2000 * Math.pow(2, initAttempt), 10000);
            
            setInitError(`Payment system is busy. Will retry in ${Math.ceil(retryDelay/1000)} seconds.`);
            setIsInitRetrying(true);
            
            const timeoutId = window.setTimeout(() => {
              if (mounted) {
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
    
    return () => {
      mounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [toast, initAttempt, isInitRetrying, retryTimeout]);

  useEffect(() => {
    if (!stripe || !clientSecret || !stripeReady) return;
    
    try {
      console.log('Creating Elements instance with client secret');
      const elementsInstance = stripe.elements({
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#990000',
            colorBackground: '#ffffff',
            colorText: '#1a1a1a',
            colorDanger: '#ff5555',
            fontFamily: 'system-ui, sans-serif',
            borderRadius: '8px',
          },
        },
      });

      setElements(elementsInstance);
    } catch (error) {
      console.error('Error creating Stripe Elements:', error);
      setInitError('Failed to initialize payment form. Please try again.');
    }
  }, [stripe, clientSecret, stripeReady]);

  useEffect(() => {
    if (!elements) return;
    
    const cardContainer = document.getElementById('card-element');
    if (!cardContainer) {
      console.warn('Card element container not found');
      return;
    }
    
    try {
      cardContainer.innerHTML = '';
      
      console.log('Creating and mounting card element');
      const card = elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            fontFamily: 'system-ui, sans-serif',
            '::placeholder': {
              color: '#aab7c4',
            },
          },
          invalid: {
            color: '#ff5555',
          },
        },
      });

      card.mount('#card-element');
      setCardElement(card);

      card.on('change', (event: any) => {
        setCardError(event.error ? event.error.message : '');
        setCardComplete(event.complete);
      });

      return () => {
        card.unmount();
      };
    } catch (error) {
      console.error('Error mounting card element:', error);
      setInitError('Failed to initialize payment form. Please try again.');
    }
  }, [elements]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      toast({
        title: 'Error',
        description: 'Payment system is not fully loaded yet. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      console.log('Confirming card payment with client secret');
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
          },
        },
      });

      if (result.error) {
        console.error('Payment error:', result.error);
        setCardError(result.error.message || 'Payment failed');
        toast({
          title: 'Payment Failed',
          description: result.error.message || 'Payment processing failed. Please try again.',
          variant: 'destructive',
        });
      } else if (result.paymentIntent.status === 'succeeded') {
        console.log('Payment successful:', result.paymentIntent);
        toast({
          title: 'Payment Successful',
          description: 'Your session has been booked and payment processed.',
        });
        onSuccess();
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Error',
        description: 'An unexpected error occurred during payment processing.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const retryInitialization = () => {
    setInitAttempt(prev => prev + 1);
    setIsInitRetrying(false);
  };

  return (
    <div className="mt-6">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="p-4 border rounded-md">
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Payment Details</h3>
              <p className="text-sm text-muted-foreground">
                Your payment is secured with SSL encryption.
              </p>
            </div>

            {clientSecret && stripeReady && !initError && (
              <Alert className="mb-4 bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Payment system ready. Enter your card details to complete booking.
                </AlertDescription>
              </Alert>
            )}

            <div id="card-element" className="p-4 border rounded-md bg-white min-h-[100px] flex items-center justify-center">
              {(loading || isInitRetrying) && (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-usc-cardinal" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    {isInitRetrying 
                      ? "Retrying payment connection..." 
                      : "Loading payment form..."}
                  </span>
                </div>
              )}
              
              {initError && !loading && !isInitRetrying && (
                <div className="flex flex-col items-center justify-center">
                  <div className="flex items-center text-red-500 mb-2">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    <span>{initError}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={retryInitialization}
                    className="mt-2"
                  >
                    <RefreshCcw className="h-3.5 w-3.5 mr-1" />
                    Retry
                  </Button>
                </div>
              )}
            </div>

            {cardError && (
              <div className="mt-2 text-sm text-red-600">
                {cardError}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">Total: ${amount.toFixed(2)}</div>
              <div className="text-muted-foreground">
                You'll be charged after submission
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={processing || isSubmitting}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                className="bg-usc-cardinal text-white hover:bg-usc-cardinal-dark"
                disabled={!stripe || !cardComplete || processing || isSubmitting || loading || !!initError || isInitRetrying || !stripeReady}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay $${amount.toFixed(2)}`
                )}
              </Button>
            </div>
          </div>
          
          {!clientSecret && !loading && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md mt-4">
              <p className="text-sm text-amber-800 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-amber-600" />
                Payment system not fully connected. Please ensure Stripe is properly configured.
              </p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
