
import { BookSessionModal } from "./BookSessionModal";
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
  // This component ensures the BookSessionModal is always wrapped in SchedulingProvider
  return (
    <SchedulingProvider>
      <BookSessionModal 
        isOpen={isOpen} 
        onClose={onClose} 
        tutor={tutor}
        initialDate={initialDate}
        initialTime={initialTime}
      />
    </SchedulingProvider>
  );
}
