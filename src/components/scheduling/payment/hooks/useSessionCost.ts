
import { useState, useEffect } from "react";
import { BookingSlot } from "@/lib/scheduling/types";
import { Tutor } from "@/types/tutor";

/**
 * Hook for calculating session cost
 */
export function useSessionCost(selectedSlot: BookingSlot | null, tutor: Tutor | null) {
  const [sessionCost, setSessionCost] = useState<number>(0);
  
  // Calculate session cost based on booking slot duration and tutor's hourly rate
  useEffect(() => {
    if (!selectedSlot || !tutor) {
      setSessionCost(0);
      return;
    }
    
    try {
      // Calculate duration in hours
      const startTime = selectedSlot.start.split(':');
      const endTime = selectedSlot.end.split(':');
      
      const startHour = parseInt(startTime[0]);
      const startMinute = parseInt(startTime[1]);
      const endHour = parseInt(endTime[0]);
      const endMinute = parseInt(endTime[1]);
      
      // Calculate total minutes
      let totalMinutes = (endHour - startHour) * 60 + (endMinute - startMinute);
      if (totalMinutes < 0) {
        totalMinutes += 24 * 60; // Add 24 hours if end time is on the next day
      }
      
      // Convert to hours
      const durationHours = totalMinutes / 60;
      
      // Use tutor's hourly rate or default to $25/hour
      const hourlyRate = tutor.hourlyRate || 25;
      
      // Calculate cost (round to 2 decimal places)
      const cost = Math.round(hourlyRate * durationHours * 100) / 100;
      
      setSessionCost(cost);
    } catch (error) {
      console.error('Error calculating session cost:', error);
      setSessionCost(0);
    }
  }, [selectedSlot, tutor]);
  
  return { sessionCost };
}
