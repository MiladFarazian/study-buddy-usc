
import { useState, useEffect, useCallback, useMemo } from 'react';
import { format, startOfDay, addDays } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { 
  BookingSlot,
  getTutorAvailability, 
  getTutorBookedSessions,
  generateAvailableSlots
} from "@/lib/scheduling";
import { WeeklyAvailability } from "@/lib/scheduling/types/availability";
import { Tutor } from "@/types/tutor";

export function useAvailabilityData(tutor: Tutor, startDate: Date) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([]);
  const [hasAvailability, setHasAvailability] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState<number>(0);
  const [tutorAvailability, setTutorAvailability] = useState<WeeklyAvailability | null>(null);
  
  // Memoize tutor ID to prevent unnecessary re-renders
  const tutorId = useMemo(() => tutor?.id, [tutor]);
  
  // Always fetch from today forward (fixed window) to prevent earlier days from disappearing
  const windowStart = useMemo(() => startOfDay(new Date()), []);

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
      console.log(`Loading availability for tutor: ${tutorId} (window starts at ${windowStart.toISOString()})`);
      
      // Get tutor's availability settings
      const availability = await getTutorAvailability(tutorId);
      
      if (!availability) {
        console.log("No availability found for tutor:", tutorId);
        setHasAvailability(false);
        setErrorMessage("This tutor hasn't set their availability yet.");
        setTutorAvailability(null);
        setLoading(false);
        return;
      }
      
      // Store the availability data for duration validation
      setTutorAvailability(availability);
      console.log("✅ Tutor availability data loaded for validation:", availability);
      console.log("🔍 Phase 1 & 2 Test - Availability structure:", Object.keys(availability));
      console.log("🔍 Phase 1 & 2 Test - Sample day slots:", availability.monday || availability.tuesday || "No weekday slots found");
      
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
      
      // Get tutor's booked sessions (always from windowStart, not selected date)
      const bookedSessions = await getTutorBookedSessions(tutorId, windowStart, addDays(windowStart, 28));
      
      // Generate available slots (always from windowStart, not selected date)
      const slots = await generateAvailableSlots(availability, bookedSessions, windowStart, 28, tutorId);
      
      console.log(`Generated ${slots.length} available slots for tutor: ${tutorId}`);
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
  }, [tutorId, windowStart, toast]);

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
  }, [tutorId, windowStart, fetchTrigger, loadAvailability]);

  const refreshAvailability = useCallback(() => {
    setFetchTrigger(prev => prev + 1);
  }, []);

  return { 
    loading, 
    availableSlots, 
    hasAvailability, 
    errorMessage, 
    refreshAvailability,
    tutorAvailability 
  };
}
