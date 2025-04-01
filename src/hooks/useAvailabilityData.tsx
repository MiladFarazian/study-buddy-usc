
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
import { useAuth } from "@/contexts/AuthContext";

export function useAvailabilityData(tutor: Tutor, startDate: Date) {
  const { toast } = useToast();
  const { session } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([]);
  const [hasAvailability, setHasAvailability] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tutorId, setTutorId] = useState<string | null>(null);
  const [fetchAttempted, setFetchAttempted] = useState<boolean>(false);

  // Store the tutor ID in state to use in dependency array
  useEffect(() => {
    if (tutor && tutor.id && tutor.id !== tutorId) {
      setTutorId(tutor.id);
    }
  }, [tutor, tutorId]);

  const loadAvailability = useCallback(async () => {
    if (!tutorId) {
      console.log("No valid tutor ID provided to useAvailabilityData");
      setLoading(false);
      setHasAvailability(false);
      setErrorMessage("No tutor information available");
      setFetchAttempted(true);
      return;
    }
    
    if (fetchAttempted) {
      return; // Don't fetch again if we've already attempted once with the same inputs
    }
    
    setLoading(true);
    try {
      console.log(`Loading availability for tutor: ${tutorId} (starting at ${startDate.toISOString()})`);
      // Get tutor's availability settings
      const availability = await getTutorAvailability(tutorId);
      
      if (!availability) {
        console.log("No availability found for tutor:", tutorId);
        setHasAvailability(false);
        setErrorMessage("This tutor hasn't set their availability yet.");
        setLoading(false);
        setFetchAttempted(true);
        return;
      }
      
      // Check if there's any actual availability set
      const hasAnySlots = Object.values(availability).some(daySlots => daySlots && daySlots.length > 0);
      
      if (!hasAnySlots) {
        console.log("Tutor has no availability slots set:", tutorId);
        setHasAvailability(false);
        setErrorMessage("This tutor has no availability slots set.");
        setLoading(false);
        setFetchAttempted(true);
        return;
      }
      
      // Get tutor's booked sessions
      const today = startOfDay(startDate);
      const bookedSessions = await getTutorBookedSessions(tutorId, today, addDays(today, 28));
      
      // Generate available slots
      const slots = generateAvailableSlots(availability, bookedSessions, today, 28);
      
      // Add tutor ID to each slot
      const slotsWithTutor = slots.map(slot => ({
        ...slot,
        tutorId: tutorId
      }));
      
      console.log(`Generated ${slotsWithTutor.length} available slots for tutor: ${tutorId}`);
      setAvailableSlots(slotsWithTutor);
      setHasAvailability(slotsWithTutor.some(slot => slot.available));
      
      if (!slotsWithTutor.some(slot => slot.available)) {
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
      setFetchAttempted(true);
    }
  }, [tutorId, startDate.toISOString(), toast, fetchAttempted]);

  // Reset fetch state when key inputs change
  useEffect(() => {
    setFetchAttempted(false);
  }, [tutorId, startDate.toISOString()]);

  useEffect(() => {
    let isMounted = true;
    
    if (isMounted && tutorId && !fetchAttempted) {
      loadAvailability();
    }
    
    return () => {
      isMounted = false;
    };
  }, [tutorId, loadAvailability, fetchAttempted]);

  const refreshAvailability = useCallback(() => {
    if (tutorId) {
      setFetchAttempted(false); // Reset the fetch state
      loadAvailability();
    }
  }, [tutorId, loadAvailability]);

  return { loading, availableSlots, hasAvailability, errorMessage, refreshAvailability };
}
