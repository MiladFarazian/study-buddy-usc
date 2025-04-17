
import { useAvailabilityData } from "@/hooks/useAvailabilityData";
import { startOfDay, isSameDay } from "date-fns";
import { Loader2 } from "lucide-react";
import { Tutor } from "@/types/tutor";
import { useBookingSteps } from "./hooks/useBookingSteps";
import { BookingSteps } from "./steps/BookingSteps";

interface BookingStepSelectorProps {
  tutor: Tutor;
  onSelectSlot: (slot: any) => void;
  onClose: () => void;
  disabled?: boolean;
}

export function BookingStepSelector({ 
  tutor, 
  onClose, 
  disabled 
}: BookingStepSelectorProps) {
  const {
    step,
    selectedSlot,
    selectedDuration,
    isBooking,
    handleSelectTimeSlot,
    handleSelectDuration,
    handleContinueToConfirmation,
    handleConfirmBooking,
    goBack
  } = useBookingSteps(tutor, onClose);

  // Get availability data
  const today = startOfDay(new Date());
  const { loading, availableSlots } = useAvailabilityData(tutor, today);

  // Extract all available dates
  const availableDates = availableSlots
    .filter(slot => slot.available)
    .map(slot => slot.day)
    .filter((date, index, self) => 
      index === self.findIndex(d => 
        isSameDay(d, date)
      )
    );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal" />
      </div>
    );
  }

  return (
    <BookingSteps
      step={step}
      tutor={tutor}
      selectedSlot={selectedSlot}
      selectedDuration={selectedDuration}
      availableSlots={availableSlots}
      availableDates={availableDates}
      onSelectTimeSlot={handleSelectTimeSlot}
      onSelectDuration={handleSelectDuration}
      onContinue={handleContinueToConfirmation}
      onBack={goBack}
      onClose={onClose}
      isBooking={isBooking}
      onConfirm={handleConfirmBooking}
    />
  );
}
