
import { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [fetchTrigger, setFetchTrigger] = useState<number>(0);
  
  // Memoize these values to prevent unnecessary re-renders
  const tutorId = useMemo(() => tutor?.id, [tutor]);
  const memoizedStartDate = useMemo(() => startOfDay(startDate).toISOString(), [startDate]);

  const loadAvailability = useCallback(async () => {
    if (!tutorId) {
      console.log("No valid tutor ID provided to useAvailabilityData");
      setLoading(false);
      setHasAvailability(false);
      setErrorMessage("No tutor information available");
      return;
    }
    
    setLoading(true);
    
    try {
      console.log(`Loading availability for tutor: ${tutorId} (starting at ${memoizedStartDate})`);
      
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
        setErrorMessage("This tutor has no availability slots set.");
        setLoading(false);
        return;
      }
      
      // Get tutor's booked sessions
      const today = new Date(memoizedStartDate);
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
    }
  }, [tutorId, memoizedStartDate, toast]);

  // Use effect with proper dependencies
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (isMounted && tutorId) {
        await loadAvailability();
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [tutorId, memoizedStartDate, fetchTrigger, loadAvailability]);

  const refreshAvailability = useCallback(() => {
    setFetchTrigger(prev => prev + 1);
  }, []);

  // Function to get consecutive available slots
  const getConsecutiveSlots = useCallback((startSlot: BookingSlot, durationMinutes: number = 180) => {
    // Calculate how many 30-minute slots we need to accommodate the requested duration
    const slotsNeeded = Math.ceil(durationMinutes / 30);
    
    // If only one slot is needed, just return the starting slot
    if (slotsNeeded <= 1) return [startSlot];
    
    // Get all slots for the same day
    const sameDay = availableSlots.filter(slot => {
      // Handle both Date objects and string dates
      const slotDay = slot.day instanceof Date ? slot.day : new Date(slot.day);
      const startDay = startSlot.day instanceof Date ? startSlot.day : new Date(startSlot.day);
      return slotDay.toDateString() === startDay.toDateString();
    });
    
    // Sort by start time
    sameDay.sort((a, b) => a.start.localeCompare(b.start));
    
    // Find the index of our starting slot
    const startIndex = sameDay.findIndex(slot => 
      slot.start === startSlot.start && 
      (slot.end === startSlot.end || !slot.end || !startSlot.end)
    );
    
    if (startIndex === -1) return [startSlot];
    
    // Check if we have enough consecutive slots
    const consecutiveSlots = [];
    let currentSlot = startSlot;
    consecutiveSlots.push(currentSlot);
    
    for (let i = 1; i < slotsNeeded; i++) {
      // Find the next slot that starts when the current one ends
      const nextSlotIndex = sameDay.findIndex(slot => 
        slot.start === currentSlot.end && 
        slot.available === true
      );
      
      if (nextSlotIndex === -1) break;
      
      const nextSlot = sameDay[nextSlotIndex];
      consecutiveSlots.push(nextSlot);
      currentSlot = nextSlot;
    }
    
    return consecutiveSlots;
  }, [availableSlots]);

  return { 
    loading, 
    availableSlots, 
    hasAvailability, 
    errorMessage, 
    refreshAvailability,
    getConsecutiveSlots
  };
}
