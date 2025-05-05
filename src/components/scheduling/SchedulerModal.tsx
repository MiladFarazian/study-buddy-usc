
import React, { useEffect } from "react";
import { BookSessionModal } from "./BookSessionModal";
import { Tutor } from "@/types/tutor";
import { SchedulingProvider, useScheduling } from "@/contexts/SchedulingContext";

interface SchedulerWrapperProps {
  tutor: Tutor;
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
  initialTime?: string;
}

// Internal wrapper component that has access to context
function SchedulerWrapper({ tutor, isOpen, onClose, initialDate, initialTime }: SchedulerWrapperProps) {
  const { setTutor } = useScheduling();

  // Set the tutor in context when opened
  useEffect(() => {
    if (isOpen && tutor) {
      setTutor(tutor);
    }
  }, [isOpen, tutor, setTutor]);

  return (
    <BookSessionModal
      isOpen={isOpen}
      onClose={onClose}
      tutor={tutor}
      initialDate={initialDate}
      initialTime={initialTime}
    />
  );
}

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
  return (
    <SchedulingProvider>
      <SchedulerWrapper
        isOpen={isOpen}
        onClose={onClose}
        tutor={tutor}
        initialDate={initialDate}
        initialTime={initialTime}
      />
    </SchedulingProvider>
  );
}
