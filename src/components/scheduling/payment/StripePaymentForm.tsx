
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { initializeStripe } from "@/lib/stripe-utils";

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

  // Initialize Stripe
  useEffect(() => {
    const loadStripe = async () => {
      try {
        const stripeInstance = await initializeStripe();
        setStripe(stripeInstance);
      } catch (error) {
        console.error('Error loading Stripe:', error);
        toast({
          title: 'Error',
          description: 'Failed to load payment processor.',
          variant: 'destructive',
        });
      }
    };

    loadStripe();
  }, [toast]);

  // Initialize Elements when stripe and clientSecret are available
  useEffect(() => {
    if (stripe && clientSecret) {
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
    }
  }, [stripe, clientSecret]);

  // Mount CardElement when elements is available
  useEffect(() => {
    if (elements) {
      const card = elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            fontFamily: 'system-ui, sans-serif',
          },
        },
      });

      const cardContainer = document.getElementById('card-element');
      if (cardContainer) {
        card.mount('#card-element');
        setCardElement(card);

        card.on('change', (event: any) => {
          setCardError(event.error ? event.error.message : '');
          setCardComplete(event.complete);
        });
      }

      // Cleanup function
      return () => {
        card.unmount();
      };
    }
  }, [elements]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements || !cardElement || !clientSecret) {
      // Show error message if Stripe hasn't loaded
      toast({
        title: 'Error',
        description: 'Payment system is not fully loaded yet. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            // You can add billing details here if needed
          },
        },
      });

      if (result.error) {
        // Show error message
        setCardError(result.error.message || 'Payment failed');
        toast({
          title: 'Payment Failed',
          description: result.error.message || 'Payment processing failed. Please try again.',
          variant: 'destructive',
        });
      } else if (result.paymentIntent.status === 'succeeded') {
        // Payment succeeded
        toast({
          title: 'Payment Successful',
          description: 'Your session has been booked and payment processed.',
        });
        onSuccess();
      }
    } catch (error) {
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

            <div id="card-element" className="p-4 border rounded-md bg-white">
              {/* Stripe Card Element will be mounted here */}
              {!stripe && (
                <div className="flex items-center justify-center h-10">
                  <Loader2 className="h-5 w-5 animate-spin text-usc-cardinal" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading payment form...</span>
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
                disabled={!stripe || !cardComplete || processing || isSubmitting}
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
        </div>
      </form>
    </div>
  );
}
