
import { useNavigate } from "react-router-dom";
import { Tutor } from "@/types/tutor";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PaymentForm } from "./PaymentForm";
import { AuthRequiredDialog } from "./booking-modal/AuthRequiredDialog";
import { BookingStepSelector } from "./booking-modal/BookingStepSelector";
import { SlotSelectionFooter } from "./booking-modal/SlotSelectionFooter";
import { useBookingSession } from "./booking-modal/useBookingSession";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BookSessionModalProps {
  tutor: Tutor;
  isOpen: boolean;
  onClose: () => void;
}

export const BookSessionModal = ({ tutor, isOpen, onClose }: BookSessionModalProps) => {
  const navigate = useNavigate();
  
  const {
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
  } = useBookingSession(tutor, isOpen, onClose);
  
  // Show login prompt for unauthenticated users when they try to proceed
  if (authRequired && !user) {
    return <AuthRequiredDialog isOpen={isOpen} onClose={() => setAuthRequired(false)} />;
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <DialogHeader>
            <DialogTitle className="text-xl">Book a Session with {tutor.name}</DialogTitle>
            <DialogDescription>
              Select a date and time from {tutor.firstName || tutor.name.split(' ')[0]}'s availability.
            </DialogDescription>
          </DialogHeader>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        
        {step === 'select-slot' && (
          <>
            <BookingStepSelector 
              tutor={tutor} 
              onSelectSlot={handleSlotSelect}
              onClose={onClose} 
            />
            
            <SlotSelectionFooter 
              onProceed={handleProceedToPayment}
              onCancel={onClose}
              isLoading={creatingSession}
              isDisabled={!selectedSlot}
            />
          </>
        )}
        
        {step === 'payment' && sessionId && selectedSlot && user && profile && (
          <PaymentForm 
            tutor={tutor}
            selectedSlot={selectedSlot}
            sessionId={sessionId}
            studentId={user.id}
            studentName={`${profile.first_name || ''} ${profile.last_name || ''}`.trim()}
            studentEmail={user.email || ''}
            onPaymentComplete={handlePaymentComplete}
            onCancel={handleCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
