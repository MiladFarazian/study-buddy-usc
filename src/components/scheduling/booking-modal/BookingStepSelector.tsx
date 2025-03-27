import { Tutor } from "@/types/tutor";
import { BookingCalendarDrag } from "../BookingCalendarDrag";
import { BookingSlot } from "@/lib/scheduling";
import { enhanceBookingSlot } from "@/lib/scheduling/booking-utils";

interface BookingStepSelectorProps {
  tutor: Tutor;
  onSelectSlot: (slot: BookingSlot & { tutorId: string }) => void;
  onClose?: () => void;
}

export const BookingStepSelector = ({ tutor, onSelectSlot, onClose }: BookingStepSelectorProps) => {

  const handleSlotSelect = (slot: BookingSlot) => {
    const enhancedSlot = enhanceBookingSlot(slot, tutor.id);
    onSelectSlot(enhancedSlot);
  };

  return (
    <div>
      <BookingCalendarDrag 
        tutor={tutor} 
        onSelectSlot={handleSlotSelect}
        onClose={onClose} 
      />
    </div>
  );
};
