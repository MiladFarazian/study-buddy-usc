
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { BookingSlot, createSessionBooking } from "@/lib/scheduling";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { Tutor } from "@/types/tutor";

export const useBookingSession = (tutor: Tutor, isOpen: boolean, onClose: () => void) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'select-slot' | 'payment' | 'processing'>('select-slot');
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  
  useEffect(() => {
    // Reset state when modal opens/closes
    if (!isOpen) {
      setStep('select-slot');
      setSelectedSlot(null);
      setSessionId(null);
      setAuthRequired(false);
    }
  }, [isOpen]);
  
  const handleSlotSelect = (slot: BookingSlot) => {
    console.log("Selected slot:", slot);
    setSelectedSlot(slot);
    
    // If user is not logged in, we'll show the login prompt when they try to proceed
    if (!user) {
      setAuthRequired(true);
      return;
    }
    
    // If the user is logged in, proceed directly to payment
    handleProceedToPayment(slot);
  };
  
  const handleProceedToPayment = async (slot = selectedSlot) => {
    if (!slot) return;
    
    // Redirect to login if not authenticated
    if (!user || !profile) {
      setAuthRequired(true);
      return;
    }
    
    setCreatingSession(true);
    
    try {
      // Format the date and times for the session
      const sessionDate = format(slot.day, 'yyyy-MM-dd');
      const startTime = `${sessionDate}T${slot.start}:00`;
      const endTime = `${sessionDate}T${slot.end}:00`;
      
      // Create the session in the database
      const session = await createSessionBooking(
        user.id,
        tutor.id,
        null, // No course selected for now
        startTime,
        endTime,
        null, // No location for now
        null  // No notes for now
      );
      
      if (!session) throw new Error("Failed to create session");
      
      // Calculate session cost
      const startTimeObj = parseISO(`2000-01-01T${slot.start}`);
      const endTimeObj = parseISO(`2000-01-01T${slot.end}`);
      const durationHours = differenceInMinutes(endTimeObj, startTimeObj) / 60;
      const sessionCost = (tutor.hourlyRate || 25) * durationHours;
      
      setSessionId(session.id);
      setStep('payment');
      
      console.log("Session created, moving to payment step", {
        sessionId: session.id,
        cost: sessionCost,
        duration: durationHours
      });
      
    } catch (error) {
      console.error("Error creating session:", error);
      toast({
        title: "Error",
        description: "Failed to create the session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingSession(false);
    }
  };
  
  const handlePaymentComplete = () => {
    toast({
      title: "Booking Confirmed",
      description: "Your session has been successfully booked!",
    });
    onClose();
  };
  
  const handleCancel = () => {
    // Reset state
    setStep('select-slot');
    setSelectedSlot(null);
    setSessionId(null);
    onClose();
  };
  
  return {
    user,
    profile,
    step,
    selectedSlot,
    sessionId,
    creatingSession,
    authRequired,
    handleSlotSelect,
    handleProceedToPayment,
    handlePaymentComplete,
    handleCancel,
    setAuthRequired
  };
};
