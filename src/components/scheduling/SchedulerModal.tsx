
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tutor } from "@/types/tutor";
import { BookingStepSelector } from "./booking-modal/BookingStepSelector";
import { BookingSlot } from "@/lib/scheduling";
import { useBookingSession } from "./booking-modal/useBookingSession";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    handleSlotSelect,
    handleProceedToPayment,
    handlePaymentComplete,
    handleCancel,
    setAuthRequired
  } = useBookingSession(tutor, isOpen, onClose);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Book a Session with {tutor.name}</DialogTitle>
        </DialogHeader>
        
        <BookingStepSelector 
          tutor={tutor} 
          onSelectSlot={handleSlotSelect} 
          onClose={onClose}
          initialDate={initialDate}
          initialTime={initialTime}
        />
      </DialogContent>
    </Dialog>
  );
}
