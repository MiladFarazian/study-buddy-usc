
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tutor } from "@/types/tutor";
import { BookingStepSelector } from "./booking-modal/BookingStepSelector";
import { BookingSlot } from "@/lib/scheduling/types";
import { useBookingSession } from "./booking-modal/useBookingSession";
import { SessionDetailsDisplay } from "./payment/SessionDetailsDisplay";
import { PaymentCardElement } from "./payment/PaymentCardElement";
import { PaymentSuccessScreen } from "./payment/PaymentSuccessScreen";
import { Loader2, AlertTriangle } from "lucide-react";
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

  // Create a proper BookingSlot with all required properties
  // when selectedSlot is either null or missing properties
  const completeBookingSlot: BookingSlot = selectedSlot ? {
    tutorId: selectedSlot.tutorId || tutor.id,
    day: selectedSlot.day,
    start: selectedSlot.start,
    end: selectedSlot.end,
    available: selectedSlot.available ?? true
  } : {
    tutorId: tutor.id,
    day: new Date(),
    start: '',
    end: '',
    available: true
  };

  // Always call usePaymentForm hook with default values
  const paymentForm = usePaymentForm({
    tutor: tutor,
    selectedSlot: completeBookingSlot,
    sessionId: sessionId || '',
    studentId: user?.id || '',
    studentName: user?.user_metadata?.full_name || '',
    studentEmail: user?.email || '',
    onPaymentComplete: handlePaymentComplete
  });

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
                    {paymentForm.setupError ? (
                      <div className="p-4 border border-red-300 bg-red-50 rounded-md mb-4 flex items-start">
                        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-red-800">Payment Setup Error</h4>
                          <p className="text-sm text-red-700 mt-1">
                            {paymentForm.setupError}. Please contact support if this issue persists.
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-3"
                            onClick={handleCancel}
                          >
                            Go Back
                          </Button>
                        </div>
                      </div>
                    ) : (
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
                    )}
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
