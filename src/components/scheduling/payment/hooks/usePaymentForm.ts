
import { useState } from "react";
import { BookingSlot } from "@/lib/scheduling/types";
import { Tutor } from "@/types/tutor";
import { useStripeInitialization } from "./useStripeInitialization";
import { useStripeElements } from "./useStripeElements";
import { usePaymentSubmission } from "./usePaymentSubmission";
import { usePaymentIntent } from "./usePaymentIntent";
import { useSessionCost } from "./useSessionCost";

/**
 * Main hook for payment form functionality with modularity
 */
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
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Initialize Stripe
  const {
    stripe,
    stripeLoaded,
    loading,
    initError,
    isInitRetrying,
    retryInitialization
  } = useStripeInitialization();
  
  // Calculate session cost
  const { sessionCost } = useSessionCost(selectedSlot, tutor);
  
  // Handle payment intent
  const {
    clientSecret,
    setupError,
    errorCode,
    isRetrying,
    retrySetupPayment
  } = usePaymentIntent({
    sessionId,
    studentId,
    tutor,
    selectedSlot,
    sessionCost,
    stripeLoaded
  });
  
  // Handle Stripe Elements
  const {
    cardElement,
    cardError,
    cardComplete,
    setCardError
  } = useStripeElements(stripe, clientSecret, stripeLoaded);
  
  // Handle payment submission
  const {
    isSubmitting,
    handleSubmitPayment
  } = usePaymentSubmission(stripe, clientSecret, () => {
    setPaymentComplete(true);
    onPaymentComplete();
  });
  
  // Wrapper for handleSubmitPayment that includes the cardElement
  const submitPayment = (e: React.FormEvent<HTMLFormElement>) => {
    if (!cardElement) return;
    setProcessing(true);
    handleSubmitPayment(e, cardElement)
      .finally(() => setProcessing(false));
  };
  
  // Function to handle card element ready
  const handleCardElementReady = (element: any) => {
    // If needed for compatibility with old code
  };
  
  return {
    loading,
    processing: processing || isSubmitting,
    paymentComplete,
    stripeLoaded,
    cardElement,
    clientSecret,
    cardError,
    cardComplete,
    sessionCost,
    setupError,
    errorCode,
    isRetrying: isRetrying || isInitRetrying,
    initError,
    submitPayment,
    handleCardElementReady,
    retryInitialization,
    retryPaymentSetup,
    setCardError,
  };
}
