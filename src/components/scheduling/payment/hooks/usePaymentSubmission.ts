
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook for handling payment submission
 */
export function usePaymentSubmission(stripe: any, clientSecret: string | null, onSuccess: () => void) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const handleSubmitPayment = useCallback(async (
    e: React.FormEvent<HTMLFormElement>,
    cardElement: any
  ) => {
    e.preventDefault();

    if (!stripe || !cardElement || !clientSecret) {
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
          billing_details: {},
        },
      });

      if (result.error) {
        console.error('Payment error:', result.error);
        
        // Handle specific error codes
        if (result.error.code === 'card_declined') {
          toast({
            title: 'Card Declined',
            description: 'Your card was declined. Please try a different payment method.',
            variant: 'destructive',
          });
        } else if (result.error.code === 'expired_card') {
          toast({
            title: 'Expired Card',
            description: 'Your card has expired. Please try a different card.',
            variant: 'destructive',
          });
        } else if (result.error.code === 'processing_error') {
          toast({
            title: 'Processing Error',
            description: 'An error occurred while processing your card. Please try again.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Payment Failed',
            description: result.error.message || 'Payment processing failed. Please try again.',
            variant: 'destructive',
          });
        }
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
  }, [stripe, clientSecret, toast, onSuccess]);
  
  return {
    isSubmitting,
    handleSubmitPayment
  };
}
