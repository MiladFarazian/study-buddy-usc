
import React from "react";
import { BookSessionModal } from "./booking-modal/BookSessionModal";
import { Tutor } from "@/types/tutor";
import { SchedulingProvider } from "@/contexts/SchedulingContext";

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
  // Check if initialDate and initialTime are valid
  const hasValidInitialDate = initialDate instanceof Date && !isNaN(initialDate.getTime());
  const hasValidInitialTime = typeof initialTime === 'string' && initialTime.trim() !== '';
  
  console.log("SchedulerModal initialized with:", { 
    isOpen, 
    tutor: tutor?.id,
    initialDate: hasValidInitialDate ? initialDate : undefined,
    initialTime: hasValidInitialTime ? initialTime : undefined
  });
  
  return (
    <SchedulingProvider>
      <BookSessionModal
        isOpen={isOpen}
        onClose={onClose}
        tutor={tutor}
        initialDate={hasValidInitialDate ? initialDate : undefined}
        initialTime={hasValidInitialTime ? initialTime : undefined}
      />
    </SchedulingProvider>
  );
}
