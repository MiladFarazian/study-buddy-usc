
import { useState, useEffect, useCallback } from 'react';
import { Tutor } from '@/types/tutor';
import { BookingSlot, getTutorAvailability, getTutorBookedSessions, generateAvailableSlots } from '@/lib/scheduling-utils';
import { addDays } from 'date-fns';

export function useAvailabilityData(tutor: Tutor | null, startDate: Date) {
  const [loading, setLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([]);
  const [hasAvailability, setHasAvailability] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const tutorId = tutor?.id;

  const loadAvailability = useCallback(async () => {
    if (!tutorId) {
      setLoading(false);
      setHasAvailability(false);
      setErrorMessage("Tutor information not available");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      console.log("Loading availability for tutor:", tutorId);
      
      // Get tutor's availability settings
      const availability = await getTutorAvailability(tutorId);
      
      if (!availability) {
        console.log("No availability found for tutor:", tutorId);
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
        console.log("Tutor has no availability slots set:", tutorId);
        setHasAvailability(false);
        setErrorMessage("This tutor has no available time slots.");
        setLoading(false);
        return;
      }
      
      // Get tutor's booked sessions
      const today = new Date();
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
      setHasAvailability(slotsWithTutor.length > 0);
      
    } catch (error) {
      console.error("Error loading tutor availability:", error);
      setErrorMessage("Failed to load availability data.");
      setHasAvailability(false);
    } finally {
      setLoading(false);
    }
  }, [tutorId]);

  useEffect(() => {
    if (tutorId) {
      loadAvailability();
    }
  }, [tutorId, loadAvailability]);

  // Function to refresh availability data
  const refreshAvailability = useCallback(() => {
    loadAvailability();
  }, [loadAvailability]);

  return {
    loading,
    availableSlots,
    hasAvailability,
    errorMessage,
    refreshAvailability
  };
}
