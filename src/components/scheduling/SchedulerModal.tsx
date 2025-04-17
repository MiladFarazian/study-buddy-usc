
import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tutor } from "@/types/tutor";
import { NewBookingWizard } from "./NewBookingWizard";
import { SchedulingProvider } from "@/contexts/SchedulingContext";

interface SchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutor: Tutor;
  initialDate?: Date;
  initialTime?: string;
}

export function SchedulerModal({ isOpen, onClose, tutor, initialDate, initialTime }: SchedulerModalProps) {
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
