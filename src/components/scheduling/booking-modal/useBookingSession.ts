
import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling/types";
import { createSessionBooking } from "@/lib/scheduling";
import { createPaymentIntent } from "@/lib/stripe-utils";
import { supabase } from "@/integrations/supabase/client";

export const useBookingSession = (tutor: Tutor, isOpen: boolean, onClose: () => void) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'select-slot' | 'payment' | 'processing'>('select-slot');
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  
  // Calculate session cost based on tutor hourly rate and duration
  const calculateSessionCost = (slot: BookingSlot) => {
    if (!tutor.hourlyRate) return 25; // Default rate if not set
    
    const startTime = new Date(`2000-01-01T${slot.start}`);
    const endTime = new Date(`2000-01-01T${slot.end}`);
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    
    return tutor.hourlyRate * durationHours;
  };
  
  const handleSlotSelect = useCallback(async (slot: BookingSlot) => {
    if (!user) {
      setAuthRequired(true);
      return;
    }
    
    setSelectedSlot(slot);
    
    // Calculate payment amount
    const cost = calculateSessionCost(slot);
    setPaymentAmount(cost);
    
    try {
      setCreatingSession(true);
      
      // Parse start and end time
      const startDate = new Date(slot.day);
      const [startHour, startMin] = slot.start.split(':').map(Number);
      startDate.setHours(startHour, startMin, 0, 0);
      
      const endDate = new Date(slot.day);
      const [endHour, endMin] = slot.end.split(':').map(Number);
      endDate.setHours(endHour, endMin, 0, 0);
      
      // Create booking
      const bookingResult = await createSessionBooking(
        user.id,
        tutor.id,
        null, // courseId
        startDate.toISOString(),
        endDate.toISOString(),
        null, // location
        null  // notes
      );
      
      if (bookingResult && bookingResult.id) {
        setSessionId(bookingResult.id);
        
        // Create payment intent
        const amountInCents = Math.round(cost * 100);
        const paymentIntent = await createPaymentIntent(
          bookingResult.id,
          amountInCents,
          tutor.id,
          user.id,
          `Tutoring session with ${tutor.name}`
        );
        
        setClientSecret(paymentIntent.client_secret);
        setStep('payment');
      }
    } catch (error) {
      console.error("Error preparing session:", error);
      toast({
        title: "Booking Failed",
        description: "There was an error setting up your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingSession(false);
    }
  }, [user, tutor, toast]);
  
  const handlePaymentComplete = useCallback(() => {
    toast({
      title: "Payment Successful!",
      description: `Your session with ${tutor.name} has been scheduled.`,
    });
    
    setStep('processing');
    
    // Automatically close the modal after a delay
    setTimeout(() => {
      onClose();
    }, 2000);
  }, [tutor.name, toast, onClose]);
  
  const handleCancel = useCallback(async () => {
    // If we have a session ID but payment wasn't completed, cancel the session
    if (sessionId && step === 'payment') {
      try {
        await supabase
          .from('sessions')
          .update({ status: 'cancelled' })
          .eq('id', sessionId);
      } catch (error) {
        console.error("Error cancelling session:", error);
      }
    }
    
    setStep('select-slot');
    setSelectedSlot(null);
    setSessionId(null);
    setClientSecret(null);
    onClose();
  }, [sessionId, step, onClose]);
  
  return {
    user,
    step,
    selectedSlot,
    creatingSession,
    authRequired,
    clientSecret,
    paymentAmount,
    sessionId,
    handleSlotSelect,
    handlePaymentComplete,
    handleCancel,
    setAuthRequired
  };
};
