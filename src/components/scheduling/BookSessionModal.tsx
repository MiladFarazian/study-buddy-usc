
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tutor } from "@/types/tutor";
import { BookingStepSelector } from "./booking-modal/BookingStepSelector";
import { BookingSlot } from "@/lib/scheduling/types";
import { ErrorDisplay } from "./booking-modal/ErrorDisplay";
import { LoadingScreen } from "./booking-modal/LoadingScreen";
import { useToast } from "@/hooks/use-toast";

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

  const handleSelectSlot = async (slot: BookingSlot) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setLoading(true);
    
    try {
      // Generate a random session ID instead of using uuid
      const tempSessionId = Math.random().toString(36).substring(2, 15);
      
      // Here you would normally create a session and payment intent
      // For now, we'll just show a success message
      setTimeout(() => {
        toast({
          title: "Session booked!",
          description: `You've successfully booked a session with ${tutor.firstName || tutor.name.split(' ')[0]}.`
        });
        
        setLoading(false);
        setIsSubmitting(false);
        onClose();
      }, 1500);
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
        <div className="p-6">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
