
import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Tutor } from "@/types/tutor";
import { 
  BookingSlot, 
  getTutorAvailability, 
  getTutorBookedSessions, 
  generateAvailableSlots 
} from "@/lib/scheduling";

export const useBookingAvailability = (tutor: Tutor, selectedDate: Date) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([]);
  const [visibleSlots, setVisibleSlots] = useState<BookingSlot[]>([]);
  const [hasAvailability, setHasAvailability] = useState(true);

  // Filter slots for the selected date
  useEffect(() => {
    if (selectedDate && availableSlots.length > 0) {
      console.log('Filtering slots for selected date:', format(selectedDate, 'yyyy-MM-dd'));
      const slotsForDate = availableSlots.filter(
        slot => {
          const slotDay = slot.day instanceof Date ? slot.day : new Date(slot.day);
          return format(slotDay, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
        }
      );
      console.log(`Found ${slotsForDate.length} slots for selected date`);
      setVisibleSlots(slotsForDate);
    } else if (availableSlots.length > 0 && !selectedDate) {
      // Only fall back to today if no date is selected
      const today = new Date();
      const todaySlots = availableSlots.filter(
        slot => {
          const slotDay = slot.day instanceof Date ? slot.day : new Date(slot.day);
          return format(slotDay, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
        }
      );
      setVisibleSlots(todaySlots);
    }
  }, [selectedDate, availableSlots]);

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
      const hasAnySlots = Object.values(availability).some(daySlots => Array.isArray(daySlots) && daySlots.length > 0);
      
      if (!hasAnySlots) {
        console.log("Tutor has no availability slots set:", tutor.id);
        setHasAvailability(false);
        setLoading(false);
        return;
      }
      
      // Get tutor's booked sessions
      const today = new Date();
      const bookedSessions = await getTutorBookedSessions(tutor.id, today, addDays(today, 28));
      
      // Generate available slots
      const slots = generateAvailableSlots(availability, bookedSessions, today, 28);
      
      // Add tutor ID to each slot
      const slotsWithTutor = slots.map(slot => ({
        ...slot,
        tutorId: tutor.id
      }));
      
      console.log(`Generated ${slotsWithTutor.length} available slots for tutor: ${tutor.id}`);
      setAvailableSlots(slotsWithTutor);
      
      // Let the useEffect filter by selectedDate handle setting visibleSlots
      // Don't override with today's slots here
      
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

  return {
    loading,
    availableSlots,
    visibleSlots,
    hasAvailability,
    loadAvailability
  };
};
