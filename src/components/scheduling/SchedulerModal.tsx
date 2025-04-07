
import { BookSessionModal } from "./BookSessionModal";
import { Tutor } from "@/types/tutor";

interface SchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutor: Tutor;
  initialDate?: Date;
  initialTime?: string;
}

export function SchedulerModal(props: SchedulerModalProps) {
  return <BookSessionModal {...props} />;
}
