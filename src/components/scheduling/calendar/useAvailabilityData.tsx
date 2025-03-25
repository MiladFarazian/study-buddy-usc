
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Tutor } from "@/types/tutor";
import { getTutorAvailability, getTutorBookedSessions, generateAvailableSlots, BookingSlot, mapDateToDayOfWeek } from "@/lib/scheduling";
import { startOfWeek, addDays, format } from 'date-fns';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useAvailabilityData(tutor: Tutor, startDate: Date) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([]);
  const [hasAvailability, setHasAvailability] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Verify Supabase auth session status
  useEffect(() => {
    const checkSupabaseAuth = async () => {
      const { data } = await supabase.auth.getSession();
      console.log("Availability Data - Auth session status:", data.session ? "Active" : "None");
      
      if (!data.session) {
        console.log("No active session found - this will cause API permission issues in private routes");
      }
    };
    
    checkSupabaseAuth();
  }, []);

  useEffect(() => {
    if (tutor?.id) {
      loadAvailability();
    }
  }, [tutor?.id, startDate]);

  const loadAvailability = async () => {
    setLoading(true);
    setErrorMessage(null);
    
    try {
      console.log(`Loading availability for tutor: ${tutor.id}, name: ${tutor.name}`);
      console.log(`Start date for calendar: ${format(startDate, 'yyyy-MM-dd')} (${mapDateToDayOfWeek(startDate)})`);
      
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
      
      // Days of the week in the current calendar view
      const daysInView = [];
      for (let i = 0; i < 7; i++) {
        const day = addDays(startDate, i);
        const dayOfWeek = mapDateToDayOfWeek(day);
        daysInView.push({ date: day, dayOfWeek });
      }
      console.log("Days in current calendar view:", daysInView.map(d => `${format(d.date, 'yyyy-MM-dd')} (${d.dayOfWeek})`));
      
      // Log available days in the tutor's schedule
      for (const [day, slots] of Object.entries(availability)) {
        if (slots.length > 0) {
          console.log(`Tutor is available on ${day}s with ${slots.length} slots`);
        }
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
      
      if (slotsWithTutor.length > 0) {
        // Log some example slots for debugging
        const exampleSlots = slotsWithTutor.slice(0, Math.min(3, slotsWithTutor.length));
        exampleSlots.forEach(slot => {
          console.log(`Available slot: ${format(slot.day, 'yyyy-MM-dd')} (${mapDateToDayOfWeek(slot.day)}) from ${slot.start} to ${slot.end}`);
        });
      }
      
      setAvailableSlots(slotsWithTutor);
      
      // If we got to this point but have no slots, set a message
      if (slotsWithTutor.length === 0) {
        setErrorMessage("No available booking slots found for the selected date range.");
      } else {
        setHasAvailability(true);
      }
      
    } catch (error: any) {
      console.error("Error loading tutor availability:", error);
      
      // Provide more detailed error information
      let errorMsg = "An error occurred while loading availability data.";
      
      if (error?.message?.includes("No API key found") || error?.message?.includes("JWT")) {
        errorMsg = "Authentication error. Please sign in to view availability.";
        console.error("Auth error detected. User session may have expired or be invalid.");
      }
      
      setErrorMessage(errorMsg);
      setHasAvailability(false);
      
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { loading, availableSlots, hasAvailability, errorMessage, refreshAvailability: loadAvailability };
}
