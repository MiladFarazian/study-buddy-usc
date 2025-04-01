
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { createPaymentIntent, processPayment, initializeStripe } from "@/lib/stripe-utils";
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling/types";
import { createPaymentTransaction, updatePaymentTransactionWithStripe, markPaymentComplete } from "@/lib/scheduling/payment-utils";
import { supabase } from "@/integrations/supabase/client";

export function usePaymentForm({
  tutor,
  selectedSlot,
  sessionId,
  studentId,
  studentName,
  studentEmail,
  onPaymentComplete
}: {
  tutor: Tutor;
  selectedSlot: BookingSlot;
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
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [stripe, setStripe] = useState<any>(null);
  
  // Calculate session duration and cost
  const startTime = new Date(`2000-01-01T${selectedSlot.start}`);
  const endTime = new Date(`2000-01-01T${selectedSlot.end}`);
  const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  const sessionCost = tutor.hourlyRate ? tutor.hourlyRate * durationHours : 25 * durationHours;
  
  // Load Stripe.js
  useEffect(() => {
    const loadStripe = async () => {
      try {
        const stripeInstance = await initializeStripe();
        setStripe(stripeInstance);
        setStripeLoaded(true);
      } catch (error) {
        console.error('Error loading Stripe:', error);
        toast({
          title: 'Error',
          description: 'Failed to load payment processor. Please try again.',
          variant: 'destructive',
        });
      }
    };
    
    loadStripe();
  }, [toast]);
  
  // Create payment transaction when component mounts
  useEffect(() => {
    const setupPayment = async () => {
      try {
        setLoading(true);
        
        // Create a payment intent with Stripe
        const formattedDate = format(new Date(selectedSlot.day), 'MMM dd, yyyy');
        const description = `Tutoring session with ${tutor.name} on ${formattedDate} at ${selectedSlot.start}`;
        
        const paymentIntent = await createPaymentIntent(
          sessionId,
          sessionCost,
          tutor.id,
          studentId,
          description
        );
        
        console.log("Received payment intent:", paymentIntent);
        setClientSecret(paymentIntent.client_secret);
      } catch (error) {
        console.error('Error setting up payment:', error);
        toast({
          title: 'Payment Setup Error',
          description: 'Failed to set up payment. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (sessionId && studentId && tutor.id && stripeLoaded) {
      setupPayment();
    }
  }, [sessionId, studentId, tutor.id, tutor.name, selectedSlot, sessionCost, toast, stripeLoaded]);
  
  const handleCardElementReady = (element: any) => {
    setCardElement(element);
    
    // Add event listener for card errors
    element.on('change', (event: any) => {
      setCardError(event.error ? event.error.message : '');
    });
  };
  
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
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: studentName || 'Unknown Student',
            email: studentEmail || 'unknown@example.com'
          }
        }
      });
      
      if (result.error) {
        throw new Error(result.error.message || 'Payment failed');
      }
      
      if (result.paymentIntent.status === 'succeeded') {
        // Show success message
        toast({
          title: 'Payment Successful',
          description: 'Your session has been booked and payment processed.',
        });
        
        setPaymentComplete(true);
        
        // Call the onPaymentComplete callback
        onPaymentComplete();
      } else if (result.paymentIntent.status === 'requires_action') {
        // Handle any required actions like 3D Secure authentication
        toast({
          title: 'Additional Authentication Required',
          description: 'Please complete the authentication process to finalize your payment.',
        });
      } else {
        // Handle other potential statuses
        toast({
          title: 'Payment Processing',
          description: 'Your payment is being processed. We'll notify you when it completes.',
        });
      }
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
  
  return {
    loading,
    processing,
    paymentComplete,
    stripeLoaded,
    cardElement,
    clientSecret,
    cardError,
    sessionCost,
    handleCardElementReady,
    handleSubmitPayment,
    setCardError,
  };
}
