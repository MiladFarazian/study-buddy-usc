
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tutor } from "@/types/tutor";
import { SchedulingProvider } from "@/contexts/SchedulingContext";
import { useAuthState } from "@/hooks/useAuthState";
import { NewBookingWizard } from "./NewBookingWizard";

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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] p-0 max-h-[90vh] overflow-y-auto">
        <DialogTitle className="p-6 pb-0 text-xl font-semibold">Book a Session with {tutor.name}</DialogTitle>
        <SchedulingProvider>
          <NewBookingWizard 
            tutor={tutor} 
            onClose={onClose}
            initialDate={initialDate}
            initialTime={initialTime}
          />
        </SchedulingProvider>
      </DialogContent>
    </Dialog>
  );
}
