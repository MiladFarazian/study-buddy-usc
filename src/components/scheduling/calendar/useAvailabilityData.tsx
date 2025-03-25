
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Tutor } from "@/types/tutor";
import { getTutorAvailability, getTutorBookedSessions, generateAvailableSlots, BookingSlot } from "@/lib/scheduling";
import { startOfWeek, addDays } from 'date-fns';

export function useAvailabilityData(tutor: Tutor, startDate: Date) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([]);
  const [hasAvailability, setHasAvailability] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (tutor.id) {
      loadAvailability();
    }
  }, [tutor.id, startDate]);

  const loadAvailability = async () => {
    setLoading(true);
    setErrorMessage(null);
    
    try {
      console.log(`Loading availability for tutor: ${tutor.id}, name: ${tutor.name}`);
      
      // Get tutor's availability settings
      const availability = await getTutorAvailability(tutor.id);
      
      console.log("Availability data received:", availability);
      
      if (!availability) {
        console.log(`No availability found for tutor: ${tutor.id}`);
        setHasAvailability(false);
        setErrorMessage("No availability settings found for this tutor.");
        setLoading(false);
        return;
      }
      
      // Check if there's any actual availability set
      const hasAnySlots = Object.values(availability).some(daySlots => daySlots.length > 0);
      console.log("Has any availability slots:", hasAnySlots);
      
      if (!hasAnySlots) {
        console.log(`Tutor has empty availability slots: ${tutor.id}`);
        setHasAvailability(false);
        setErrorMessage("Tutor has availability set but no time slots defined.");
        setLoading(false);
        return;
      }
      
      // Get tutor's booked sessions
      const bookedSessions = await getTutorBookedSessions(tutor.id, startDate, addDays(startDate, 6));
      console.log("Booked sessions:", bookedSessions);
      
      // Generate available slots
      const slots = generateAvailableSlots(availability, bookedSessions, startDate, 7);
      console.log(`Generated ${slots.length} available slots`);
      
      // Add tutor ID to each slot
      const slotsWithTutor = slots.map(slot => ({
        ...slot,
        tutorId: tutor.id
      }));
      
      console.log(`Final available slots: ${slotsWithTutor.length}`);
      setAvailableSlots(slotsWithTutor);
      
      // If we got to this point but have no slots, set a message
      if (slotsWithTutor.length === 0) {
        setErrorMessage("No available booking slots found for the selected date range.");
      } else {
        setHasAvailability(true);
      }
      
    } catch (error) {
      console.error("Error loading tutor availability:", error);
      setErrorMessage("An error occurred while loading availability data.");
      
      toast({
        title: "Error",
        description: "Failed to load tutor's availability.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { loading, availableSlots, hasAvailability, errorMessage };
}
