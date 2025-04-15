
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tutor } from "@/types/tutor";
import { BookingStepSelector } from "./booking-modal/BookingStepSelector";
import { BookingSlot } from "@/lib/scheduling/types";
import { ErrorDisplay } from "./booking-modal/ErrorDisplay";
import { LoadingScreen } from "./booking-modal/LoadingScreen";
import { useToast } from "@/hooks/use-toast";
import { createSessionBooking } from "@/lib/scheduling/booking-utils";
import { useAuthState } from "@/hooks/useAuthState";

interface BookSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutor: Tutor;
  initialDate?: Date;
  initialTime?: string;
}

export function BookSessionModal({ 
  isOpen, 
  onClose, 
  tutor,
  initialDate,
  initialTime
}: BookSessionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuthState();

  const handleSelectSlot = async (slot: BookingSlot) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setLoading(true);
    
    try {
      if (!user) {
        throw new Error("You must be logged in to book a session");
      }
      
      // Calculate start and end time from the slot
      const startTime = new Date(slot.day);
      const [startHour, startMinute] = slot.start.split(':').map(Number);
      startTime.setHours(startHour, startMinute, 0, 0);
      
      const endTime = new Date(slot.day);
      const [endHour, endMinute] = slot.end.split(':').map(Number);
      endTime.setHours(endHour, endMinute, 0, 0);
      
      // Create the session in the database
      const session = await createSessionBooking(
        user.id,
        tutor.id,
        null, // No course ID
        startTime.toISOString(),
        endTime.toISOString(),
        null, // No location
        null // No notes
      );
      
      if (!session) {
        throw new Error("Failed to create session");
      }
      
      toast({
        title: "Session booked!",
        description: `You've successfully booked a session with ${tutor.firstName || tutor.name.split(' ')[0]}.`
      });
      
      setLoading(false);
      setIsSubmitting(false);
      onClose();
      
      // Force refresh the schedule page if we're on it
      if (window.location.pathname === '/schedule') {
        window.location.reload();
      }
      
    } catch (err) {
      console.error("Error booking session:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingScreen message="Processing your booking..." />;
    }

    if (error) {
      return <ErrorDisplay message={error} onClose={handleClose} />;
    }

    return (
      <BookingStepSelector 
        tutor={tutor}
        onSelectSlot={handleSelectSlot}
        onClose={handleClose}
        disabled={isSubmitting}
      />
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] p-0 max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">Book a Session</DialogTitle>
        <div className="p-6">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
