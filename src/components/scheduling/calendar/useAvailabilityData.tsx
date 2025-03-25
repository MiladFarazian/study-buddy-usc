
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

  useEffect(() => {
    if (tutor.id) {
      loadAvailability();
    }
  }, [tutor.id, startDate]);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      console.log("Loading availability for tutor:", tutor.id);
      // Get tutor's availability settings
      const availability = await getTutorAvailability(tutor.id);
      
      if (!availability) {
        console.log("No availability found for tutor:", tutor.id);
        setHasAvailability(false);
        setLoading(false);
        return;
      }
      
      // Check if there's any actual availability set
      const hasAnySlots = Object.values(availability).some(daySlots => daySlots.length > 0);
      
      if (!hasAnySlots) {
        console.log("Tutor has no availability slots set:", tutor.id);
        setHasAvailability(false);
        setLoading(false);
        return;
      }
      
      // Get tutor's booked sessions
      const bookedSessions = await getTutorBookedSessions(tutor.id, startDate, addDays(startDate, 6));
      
      // Generate available slots
      const slots = generateAvailableSlots(availability, bookedSessions, startDate, 7);
      
      // Add tutor ID to each slot
      const slotsWithTutor = slots.map(slot => ({
        ...slot,
        tutorId: tutor.id
      }));
      
      console.log(`Generated ${slotsWithTutor.length} available slots for tutor: ${tutor.id}`);
      setAvailableSlots(slotsWithTutor);
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

  return { loading, availableSlots, hasAvailability };
}
