
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tutor } from "@/types/tutor";
import { BookingStepSelector } from "./booking-modal/BookingStepSelector";
import { BookingSlot } from "@/lib/scheduling/types";
import { useBookingSession } from "./booking-modal/useBookingSession";
import { SessionDetailsDisplay } from "./payment/SessionDetailsDisplay";
import { PaymentCardElement } from "./payment/PaymentCardElement";
import { PaymentSuccessScreen } from "./payment/PaymentSuccessScreen";
import { Loader2 } from "lucide-react";
import { AuthRequiredDialog } from "./booking-modal/AuthRequiredDialog";
import { usePaymentForm } from "./payment/usePaymentForm";
import { useState, useEffect } from "react";

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
  const {
    user,
    step,
    selectedSlot,
    creatingSession,
    authRequired,
    sessionId,
    handleSlotSelect,
    handlePaymentComplete,
    handleCancel,
    setAuthRequired
  } = useBookingSession(tutor, isOpen, onClose);

  // Always call usePaymentForm hook with default values
  const paymentForm = usePaymentForm({
    tutor: tutor,
    selectedSlot: selectedSlot || { day: new Date(), start: '', end: '' },
    sessionId: sessionId || '',
    studentId: user?.id || '',
    studentName: user?.user_metadata?.full_name || '',
    studentEmail: user?.email || '',
    onPaymentComplete: handlePaymentComplete
  });

  // Update payment form props when data changes
  useEffect(() => {
    // This effect ensures props are updated when data is available
    // but doesn't affect the hook call pattern that must stay consistent
  }, [tutor, selectedSlot, sessionId, user]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Book a Session with {tutor.name}</DialogTitle>
          </DialogHeader>
          
          {step === 'select-slot' && (
            <div className="overflow-y-auto flex-1 px-6 pb-6">
              <BookingStepSelector 
                tutor={tutor} 
                onSelectSlot={handleSlotSelect} 
                onClose={onClose}
                initialDate={initialDate}
                initialTime={initialTime}
              />
            </div>
          )}
          
          {step === 'payment' && selectedSlot && (
            <div className="overflow-y-auto flex-1 px-6 pb-6">
              {creatingSession ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal mb-4" />
                  <p className="text-center text-muted-foreground">Setting up your booking...</p>
                </div>
              ) : (
                <>
                  <SessionDetailsDisplay 
                    tutor={tutor} 
                    selectedSlot={selectedSlot} 
                  />
                  
                  <div className="mt-6">
                    <PaymentCardElement
                      onCardElementReady={paymentForm.handleCardElementReady}
                      onSubmit={paymentForm.handleSubmitPayment}
                      onCancel={handleCancel}
                      processing={paymentForm.processing}
                      loading={paymentForm.loading}
                      cardError={paymentForm.cardError}
                      amount={paymentForm.sessionCost}
                      stripeLoaded={paymentForm.stripeLoaded}
                      clientSecret={paymentForm.clientSecret}
                    />
                  </div>
                </>
              )}
            </div>
          )}
          
          {step === 'processing' && (
            <div className="overflow-y-auto flex-1 px-6 pb-6">
              <PaymentSuccessScreen onComplete={handleCancel} />
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <AuthRequiredDialog 
        isOpen={authRequired} 
        onClose={() => setAuthRequired(false)} 
      />
    </>
  );
}
