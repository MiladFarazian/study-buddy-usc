
import { useState, useEffect, useCallback } from 'react';
import { format, startOfDay, addDays } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { 
  BookingSlot,
  getTutorAvailability, 
  getTutorBookedSessions,
  generateAvailableSlots
} from "@/lib/scheduling";
import { Tutor } from "@/types/tutor";

export function useAvailabilityData(tutor: Tutor, startDate: Date) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([]);
  const [hasAvailability, setHasAvailability] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadAvailability = useCallback(async () => {
    setLoading(true);
    try {
      console.log("Loading availability for tutor:", tutor.id);
      // Get tutor's availability settings
      const availability = await getTutorAvailability(tutor.id);
      
      if (!availability) {
        console.log("No availability found for tutor:", tutor.id);
        setHasAvailability(false);
        setErrorMessage("This tutor hasn't set their availability yet.");
        setLoading(false);
        return;
      }
      
      // Check if there's any actual availability set
      const hasAnySlots = Object.values(availability).some(daySlots => 
        Array.isArray(daySlots) && daySlots.length > 0
      );
      
      if (!hasAnySlots) {
        console.log("Tutor has no availability slots set:", tutor.id);
        setHasAvailability(false);
        setErrorMessage("This tutor has no availability slots set.");
        setLoading(false);
        return;
      }
      
      // Get tutor's booked sessions
      const today = startOfDay(startDate);
      const bookedSessions = await getTutorBookedSessions(tutor.id, today, addDays(today, 28));
      
      // Generate available slots
      const slots = await generateAvailableSlots(availability, bookedSessions, today, 28, tutor.id);
      
      console.log(`Generated ${slots.length} available slots for tutor: ${tutor.id}`);
      setAvailableSlots(slots);
      setHasAvailability(slots.some(slot => slot.available));
      
      if (!slots.some(slot => slot.available)) {
        setErrorMessage("This tutor is fully booked for the next 28 days.");
      } else {
        setErrorMessage(null);
      }
      
    } catch (error) {
      console.error("Error loading tutor availability:", error);
      setErrorMessage("Failed to load tutor's availability.");
      setHasAvailability(false);
      toast({
        title: "Error",
        description: "Failed to load tutor's availability.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [tutor.id, startDate, toast]);

  useEffect(() => {
    if (tutor.id) {
      loadAvailability();
    }
  }, [tutor.id, loadAvailability]);

  const refreshAvailability = useCallback(() => {
    loadAvailability();
  }, [loadAvailability]);

  return { loading, availableSlots, hasAvailability, errorMessage, refreshAvailability };
}
