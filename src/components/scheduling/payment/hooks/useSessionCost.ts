
import { useMemo } from "react";
import { BookingSlot } from "@/lib/scheduling/types";
import { Tutor } from "@/types/tutor";

/**
 * Hook for calculating session costs
 */
export function useSessionCost(selectedSlot: BookingSlot | null, tutor: Tutor | null) {
  // Calculate session duration and cost
  const sessionDetails = useMemo(() => {
    if (!selectedSlot?.start || !selectedSlot?.end || !tutor?.hourlyRate) {
      return {
        startTime: new Date(),
        endTime: new Date(),
        durationHours: 0,
        sessionCost: 0
      };
    }
    
    const startTime = new Date(`2000-01-01T${selectedSlot.start}`);
    const endTime = new Date(`2000-01-01T${selectedSlot.end}`);
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const hourlyRate = tutor.hourlyRate || 25;
    const sessionCost = hourlyRate * durationHours;
    
    return {
      startTime,
      endTime,
      durationHours,
      sessionCost
    };
  }, [selectedSlot, tutor]);
  
  return sessionDetails;
}
