
import { useState, useCallback } from 'react';
import { BookingSlot } from "@/lib/scheduling/types";
import { Tutor } from "@/types/tutor";
import { useAuthState } from '@/hooks/useAuthState';
import { createSessionBooking } from '@/lib/scheduling/booking-utils';
import { toast } from 'sonner';

export type BookingStep = "select-date-time" | "select-duration" | "confirm" | "processing" | "complete";

export function useBookingSteps(tutor: Tutor, onClose: () => void) {
  const [step, setStep] = useState<BookingStep>("select-date-time");
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(60);
  const [isBooking, setIsBooking] = useState(false);
  const { user } = useAuthState();

  const handleSelectTimeSlot = useCallback((slot: BookingSlot) => {
    setSelectedSlot(slot);
  }, []);

  const handleSelectDuration = useCallback((duration: number) => {
    setSelectedDuration(duration);
  }, []);

  const handleContinueToConfirmation = useCallback(() => {
    setStep("confirm");
  }, []);

  const handleConfirmBooking = useCallback(async () => {
    if (!user || !selectedSlot) {
      toast.error("You must be logged in to book a session");
      return;
    }

    setIsBooking(true);
    
    try {
      const day = selectedSlot.day instanceof Date ? selectedSlot.day : new Date(selectedSlot.day);
      
      const startTime = new Date(day);
      const [startHour, startMinute] = selectedSlot.start.split(':').map(Number);
      startTime.setHours(startHour, startMinute, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + selectedDuration);
      
      const session = await createSessionBooking(
        user.id,
        tutor.id,
        null,
        startTime.toISOString(),
        endTime.toISOString(),
        null,
        null
      );
      
      if (!session) {
        throw new Error("Failed to create booking");
      }
      
      toast.success("Session booked successfully!");
      setStep("complete");
      
    } catch (error) {
      console.error("Error booking session:", error);
      toast.error("Failed to book session. Please try again.");
    } finally {
      setIsBooking(false);
    }
  }, [user, selectedSlot, selectedDuration, tutor.id]);

  const goBack = useCallback(() => {
    if (step === "select-duration") {
      setStep("select-date-time");
    } else if (step === "confirm") {
      setStep("select-duration");
    }
  }, [step]);

  return {
    step,
    selectedSlot,
    selectedDuration,
    isBooking,
    handleSelectTimeSlot,
    handleSelectDuration,
    handleContinueToConfirmation,
    handleConfirmBooking,
    goBack
  };
}
