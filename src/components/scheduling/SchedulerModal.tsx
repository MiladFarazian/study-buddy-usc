
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookingStep, BookingSlot } from "@/lib/scheduling/types";
import { Tutor } from "@/types/tutor";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { BookingStepSelector } from "./booking-modal/BookingStepSelector";
import { BookingPaymentForm } from "./payment/BookingPaymentForm";
import { ArrowLeftIcon } from "lucide-react";
import { LoadingScreen } from "./booking-modal/LoadingScreen";
import { SuccessScreen } from "./booking-modal/SuccessScreen";
import { LoginPrompt } from "./booking-modal/LoginPrompt";

interface SchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutor: Tutor;
  initialDate?: Date;
  initialTime?: string;
}

export function SchedulerModal({ 
  isOpen, 
  onClose, 
  tutor,
  initialDate,
  initialTime
}: SchedulerModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<BookingStep>('select-slot');
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [authRequired, setAuthRequired] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setStep('select-slot');
      setSelectedSlot(null);
      setCreatingSession(false);
      setSessionId("");
      setAuthRequired(false);
      setClientSecret("");
      setPaymentAmount(0);
      setProcessing(false);
      setPaymentError(null);
    }
  }, [isOpen]);
  
  const handleSelectSlot = (slot: BookingSlot) => {
    // Convert the slot day to a Date object if it's not already
    const slotWithDateDay: BookingSlot = {
      ...slot,
      day: slot.day instanceof Date ? slot.day : new Date(slot.day as string),
      available: true
    };
    
    setSelectedSlot(slotWithDateDay);
    
    // Check if user is authenticated
    if (!user) {
      setAuthRequired(true);
      return;
    }
    
    // Move to payment step
    setStep('payment');
    
    // Create a session and get client secret (this would be implemented in a hook or utility)
    startSessionCreation(slotWithDateDay);
  };
  
  const startSessionCreation = async (slot: BookingSlot) => {
    if (!user || !slot) return;
    
    try {
      setCreatingSession(true);
      setProcessing(true);
      setPaymentError(null);
      
      toast({
        title: "Processing",
        description: "Creating your session...",
      });
      
      // Simulate creating a session
      // In a real implementation, this would call your backend API
      setTimeout(() => {
        try {
          // Mock response data
          const mockSessionId = `session-${Date.now()}`;
          const mockClientSecret = `secret-${Date.now()}`;
          const mockAmount = calculateSessionAmount(slot);
          
          setSessionId(mockSessionId);
          setClientSecret(mockClientSecret);
          setPaymentAmount(mockAmount);
          setCreatingSession(false);
          setProcessing(false);
        } catch (error) {
          handleSessionCreationError(error);
        }
      }, 1000);
      
    } catch (error) {
      handleSessionCreationError(error);
    }
  };
  
  const handleSessionCreationError = (error: any) => {
    console.error("Error creating session:", error);
    
    // Check if the error is related to the tutor's Stripe Connect setup
    if (error.message && (
      error.message.includes("payment account") || 
      error.message.includes("Stripe Connect") ||
      error.message.includes("not completed")
    )) {
      setPaymentError("The tutor hasn't completed their payment account setup. Please try a different tutor or contact support.");
    } else {
      setPaymentError("Failed to set up session. Please try again.");
    }
    
    toast({
      title: "Error",
      description: "Failed to create session. Please try again.",
      variant: "destructive",
    });
    
    setCreatingSession(false);
    setProcessing(false);
  };
  
  const calculateSessionAmount = (slot: BookingSlot): number => {
    if (!slot || !tutor?.hourlyRate) return 0;
    
    const durationMinutes = slot.durationMinutes || 60; // Default to 1 hour
    return (tutor.hourlyRate / 60) * durationMinutes;
  };
  
  const handlePaymentComplete = () => {
    setStep('processing');
    
    // In real implementation, confirm the payment and session
    setTimeout(() => {
      toast({
        title: "Success",
        description: "Your tutoring session has been booked!",
      });
      // You might want to redirect to a confirmation page here
      onClose();
    }, 2000);
  };
  
  const handleBackClick = () => {
    if (step === 'payment') {
      setStep('select-slot');
      setPaymentError(null);
    }
  };
  
  const retryPaymentSetup = () => {
    if (selectedSlot) {
      startSessionCreation(selectedSlot);
    }
  };
  
  const renderStepContent = () => {
    if (authRequired) {
      return <LoginPrompt onClose={onClose} />;
    }
    
    switch (step) {
      case 'select-slot':
        return (
          <BookingStepSelector 
            tutor={tutor} 
            onSelectSlot={handleSelectSlot} 
            onClose={onClose}
            initialDate={initialDate}
            initialTime={initialTime}
          />
        );
      case 'payment':
        return (
          <BookingPaymentForm 
            tutor={tutor}
            selectedSlot={selectedSlot}
            sessionId={sessionId}
            amount={paymentAmount}
            clientSecret={clientSecret}
            onPaymentComplete={handlePaymentComplete}
            onBack={handleBackClick}
            processing={processing}
            retryPaymentSetup={retryPaymentSetup}
            error={paymentError}
          />
        );
      case 'processing':
        return <LoadingScreen message="Completing your booking..." />;
      default:
        return <SuccessScreen />;
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md md:max-w-lg">
        <DialogHeader>
          <div className="flex items-center">
            {step !== 'select-slot' && !authRequired && (
              <Button
                variant="ghost"
                size="icon"
                className="mr-2 h-8 w-8"
                onClick={handleBackClick}
                disabled={creatingSession}
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Button>
            )}
            <DialogTitle>
              {authRequired
                ? "Login Required"
                : step === 'select-slot'
                ? "Book a Tutoring Session"
                : step === 'payment'
                ? "Complete Payment"
                : step === 'processing'
                ? "Processing"
                : "Booking Confirmed"}
            </DialogTitle>
          </div>
        </DialogHeader>
        
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
}
