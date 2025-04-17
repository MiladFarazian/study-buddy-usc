
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling/types";
import { 
  createSessionBooking,
  createPaymentTransaction,
  getTutorAvailability, 
  getTutorBookedSessions, 
  generateAvailableSlots 
} from "@/lib/scheduling";
import { addMinutes } from "date-fns";

type BookingStep = "date" | "time" | "duration" | "confirm";

export function useBookingWizard(tutor: Tutor) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<BookingStep>("date");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [availableTimeSlots, setAvailableTimeSlots] = useState<Array<{ time: string; available: boolean }>>([]);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      const availability = await getTutorAvailability(tutor.id);
      
      if (!availability) {
        toast({
          title: "No Availability",
          description: "This tutor hasn't set their availability yet.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      const today = new Date();
      const bookedSessions = await getTutorBookedSessions(tutor.id, today, addMinutes(today, 60 * 28));
      
      const slots = generateAvailableSlots(availability, bookedSessions, today, 28);
      
      const dates = slots
        .filter(slot => slot.available)
        .map(slot => slot.day instanceof Date ? slot.day : new Date(slot.day));
      
      const uniqueDates = Array.from(
        new Set(
          dates.map(d => d.toDateString())
        )
      ).map(dateStr => new Date(dateStr));
      
      setAvailableDates(uniqueDates);
      
      if (!selectedDate && uniqueDates.length > 0) {
        setSelectedDate(uniqueDates[0]);
      }
    } catch (error) {
      console.error("Error loading tutor availability:", error);
      toast({
        title: "Error",
        description: "Failed to load tutor's availability.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!user || !selectedDate || !selectedTime || !selectedDuration) {
      toast({
        title: "Error",
        description: "Missing required information for booking.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    
    try {
      const sessionDate = selectedDate.toISOString().split('T')[0];
      const startTime = `${sessionDate}T${selectedTime}:00`;
      
      const startDate = new Date(startTime);
      const endDate = addMinutes(startDate, selectedDuration);
      const endTime = endDate.toISOString();
      
      const session = await createSessionBooking(
        user.id,
        tutor.id,
        null,
        startTime,
        endTime,
        null,
        notes || null
      );
      
      if (!session) throw new Error("Failed to create session");
      
      const durationHours = selectedDuration / 60;
      const sessionCost = tutor.hourlyRate * durationHours;
      
      await createPaymentTransaction(
        session.id,
        user.id,
        tutor.id,
        sessionCost
      );
      
      toast({
        title: "Booking Confirmed",
        description: "Your session has been successfully booked!",
      });
      
      navigate('/schedule');
      
    } catch (error) {
      console.error("Error creating session:", error);
      toast({
        title: "Error",
        description: "Failed to create the session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (tutor.id) {
      loadAvailability();
    }
  }, [tutor.id]);

  return {
    step,
    setStep,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    selectedDuration,
    setSelectedDuration,
    notes,
    setNotes,
    availableTimeSlots,
    availableDates,
    loading,
    creating,
    handleConfirmBooking
  };
}
