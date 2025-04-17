
import { BookSessionModal } from "./BookSessionModal";
import { Tutor } from "@/types/tutor";

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
    <BookSessionModal 
      isOpen={isOpen} 
      onClose={onClose} 
      tutor={tutor}
      initialDate={initialDate}
      initialTime={initialTime}
    />
  );
}
