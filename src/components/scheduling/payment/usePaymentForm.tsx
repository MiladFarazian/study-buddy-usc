
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { createPaymentIntent, processPayment } from "@/lib/stripe-utils";
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling-utils";

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
  
  // Calculate session duration and cost
  const startTime = new Date(`2000-01-01T${selectedSlot.start}`);
  const endTime = new Date(`2000-01-01T${selectedSlot.end}`);
  const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  const sessionCost = tutor.hourlyRate * durationHours;
  
  useEffect(() => {
    createPaymentIntentForSession();
    setLoading(false);
  }, [sessionId]);
  
  const createPaymentIntentForSession = async () => {
    try {
      const formattedDate = format(selectedSlot.day, 'MMM dd, yyyy');
      const description = `Tutoring session with ${tutor.name} on ${formattedDate} at ${selectedSlot.start}`;
      
      console.log("Creating payment intent for session:", { 
        sessionId, 
        amount: sessionCost,
        tutorId: tutor.id,
        studentId,
        description
      });
      
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
      console.error('Error creating payment intent:', error);
      toast({
        title: 'Payment Error',
        description: 'Failed to set up payment. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const handleCardElementReady = (element: any) => {
    setCardElement(element);
    setStripeLoaded(true);
    
    // Add event listener for card errors
    element.on('change', (event: any) => {
      setCardError(event.error ? event.error.message : '');
    });
  };
  
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cardElement || !clientSecret) {
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
      const paymentResult = await processPayment(
        clientSecret,
        cardElement,
        studentName || 'Unknown Student',
        studentEmail || 'unknown@example.com'
      );
      
      console.log('Payment successful:', paymentResult);
      
      // Show success message
      toast({
        title: 'Payment Successful',
        description: 'Your session has been booked and payment processed.',
      });
      
      setPaymentComplete(true);
      
      // Call the onPaymentComplete callback after a short delay
      setTimeout(() => {
        onPaymentComplete();
      }, 2000);
      
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
