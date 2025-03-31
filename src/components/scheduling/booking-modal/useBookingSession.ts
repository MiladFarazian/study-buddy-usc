import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling/types";
import { createSessionBooking } from "@/lib/scheduling";

export const useBookingSession = (tutor: Tutor, isOpen: boolean, onClose: () => void) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'select-slot' | 'payment' | 'processing'>('select-slot');
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  
  const handleSlotSelect = useCallback((slot: BookingSlot) => {
    if (!user) {
      setAuthRequired(true);
      return;
    }
    setSelectedSlot(slot);
    setStep('payment');
  }, [user]);
  
  const handleProceedToPayment = useCallback(() => {
    if (!user) {
      setAuthRequired(true);
      return;
    }
    setStep('payment');
  }, [user]);
  
  const handlePaymentComplete = useCallback(async () => {
    if (!user || !selectedSlot) return;
    
    setCreatingSession(true);
    
    try {
      // Parse start time
      const startDate = new Date(selectedSlot.day);
      const [startHour, startMin] = selectedSlot.start.split(':').map(Number);
      startDate.setHours(startHour, startMin, 0, 0);
      
      // Set end time (30 mins after start)
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + 30);
      
      // Create booking
      await createSessionBooking(
        user.id,
        tutor.id,
        null, // courseId
        startDate.toISOString(),
        endDate.toISOString(),
        null, // location
        null  // notes
      );
      
      toast({
        title: "Session Booked!",
        description: `Your session with ${tutor.name} has been scheduled.`,
      });
      
      setStep('processing');
      
      // Automatically close the modal after a delay
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error("Error booking session:", error);
      toast({
        title: "Booking Failed",
        description: "There was an error booking your session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingSession(false);
    }
  }, [user, tutor, selectedSlot, toast, onClose]);
  
  const handleCancel = useCallback(() => {
    setStep('select-slot');
    setSelectedSlot(null);
    onClose();
  }, [onClose]);
  
  return {
    user,
    profile: null, // Replace with actual profile if needed
    step,
    selectedSlot,
    creatingSession,
    authRequired,
    handleSlotSelect,
    handleProceedToPayment,
    handlePaymentComplete,
    handleCancel,
    setAuthRequired
  };
};
