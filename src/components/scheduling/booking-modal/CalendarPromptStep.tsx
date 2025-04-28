
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling/types";
import { CalendarIntegration } from "../calendar-integration/CalendarIntegration";

interface CalendarPromptStepProps {
  tutor: Tutor;
  selectedSlot: BookingSlot;
  selectedDuration: number;
  onClose: () => void;
  onDone: () => void;
}

export function CalendarPromptStep({ 
  tutor, 
  selectedSlot, 
  selectedDuration,
  onClose,
  onDone
}: CalendarPromptStepProps) {
  // Handle both closing and completion
  const handleClose = () => {
    onDone();
    onClose();
  };
  
  return (
    <div className="max-w-md mx-auto">
      <CalendarIntegration
        tutor={tutor}
        sessionDate={selectedSlot.day instanceof Date ? selectedSlot.day : new Date(selectedSlot.day)}
        sessionDuration={selectedDuration}
        sessionStartTime={selectedSlot.start}
        onClose={handleClose}
      />
    </div>
  );
}
