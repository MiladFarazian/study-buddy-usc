
import { useState, useEffect, useMemo } from "react";
import { BookingSlot } from "@/lib/scheduling";
import { 
  formatTimeDisplay, 
  convertTimeToMinutes, 
  convertMinutesToTime 
} from "@/lib/scheduling/time-utils";
import { addMinutes, differenceInMinutes } from "date-fns";

export function useBookingState(initialDate?: Date, initialTime?: string) {
  // Date selection
  const [date, setDate] = useState<Date | undefined>(initialDate || undefined);
  
  // Time slot selection
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<BookingSlot | null>(null);
  
  // Session details
  const [sessionDuration, setSessionDuration] = useState(60); // Default to 1 hour
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(initialTime || null);
  const [calculatedCost, setCalculatedCost] = useState(0);
  
  // Student info
  const [email, setEmail] = useState("");
  
  // Calculate available start times within the selected time slot
  const availableStartTimes = useMemo(() => {
    if (!selectedTimeSlot) return [];
    
    const startMinutes = convertTimeToMinutes(selectedTimeSlot.start);
    const endMinutes = convertTimeToMinutes(selectedTimeSlot.end);
    const slotDuration = endMinutes - startMinutes;
    
    // We can only start at times that leave enough room for the session
    const maxStartMinutes = endMinutes - sessionDuration;
    
    // Generate every 30-minute increment as a possible start time
    const startTimes: string[] = [];
    for (let m = startMinutes; m <= maxStartMinutes; m += 30) {
      startTimes.push(convertMinutesToTime(m));
    }
    
    return startTimes;
  }, [selectedTimeSlot, sessionDuration]);
  
  // Set initial start time when slot is selected
  useEffect(() => {
    if (selectedTimeSlot && !selectedStartTime) {
      // Initialize with the slot's start time
      setSelectedStartTime(selectedTimeSlot.start);
    }
  }, [selectedTimeSlot, selectedStartTime]);
  
  // Update calculated cost when duration or start time changes
  useEffect(() => {
    if (selectedTimeSlot && selectedStartTime) {
      // Calculate hourly rate portion based on minutes
      const hourlyFraction = sessionDuration / 60;
      // Assuming $25/hour default
      const cost = hourlyFraction * 25;
      setCalculatedCost(cost);
    }
  }, [sessionDuration, selectedStartTime, selectedTimeSlot]);
  
  // Handle time slot selection
  const handleTimeSlotSelect = (slot: BookingSlot) => {
    setSelectedTimeSlot(slot);
    // Reset start time to the beginning of the slot
    setSelectedStartTime(slot.start);
    
    // Set initial duration based on slot length
    const slotStart = convertTimeToMinutes(slot.start);
    const slotEnd = convertTimeToMinutes(slot.end);
    const availableDuration = slotEnd - slotStart;
    
    // Default to 60 minutes unless the slot is shorter
    const defaultDuration = Math.min(60, availableDuration);
    setSessionDuration(defaultDuration);
  };
  
  // Handle start time change
  const handleStartTimeChange = (time: string, hourlyRate: number) => {
    setSelectedStartTime(time);
    // Recalculate cost
    const hourlyFraction = sessionDuration / 60;
    const cost = hourlyFraction * hourlyRate;
    setCalculatedCost(cost);
  };
  
  // Handle duration change
  const handleDurationChange = (durationMinutes: number, hourlyRate: number) => {
    setSessionDuration(durationMinutes);
    // Recalculate cost
    const hourlyFraction = durationMinutes / 60;
    const cost = hourlyFraction * hourlyRate;
    setCalculatedCost(cost);
  };
  
  // Get max possible duration based on selected slot and start time
  const getMaxDuration = (): number => {
    if (!selectedTimeSlot || !selectedStartTime) return 60;
    
    const slotEndMinutes = convertTimeToMinutes(selectedTimeSlot.end);
    const startTimeMinutes = convertTimeToMinutes(selectedStartTime);
    
    return slotEndMinutes - startTimeMinutes;
  };
  
  // Get final booking slot object
  const getFinalBookingSlot = (): BookingSlot | null => {
    if (!selectedTimeSlot || !selectedStartTime || !date) return null;
    
    const startMinutes = convertTimeToMinutes(selectedStartTime);
    const endMinutes = startMinutes + sessionDuration;
    const endTime = convertMinutesToTime(endMinutes);
    
    return {
      ...selectedTimeSlot,
      day: date,
      start: selectedStartTime,
      end: endTime,
      tutorId: selectedTimeSlot.tutorId
    };
  };
  
  // Get formatted time range for display
  const getSessionTimeRange = (): string => {
    if (!selectedStartTime) return "";
    
    const startMinutes = convertTimeToMinutes(selectedStartTime);
    const endMinutes = startMinutes + sessionDuration;
    const endTime = convertMinutesToTime(endMinutes);
    
    return `${formatTimeDisplay(selectedStartTime)} - ${formatTimeDisplay(endTime)}`;
  };
  
  return {
    date,
    setDate,
    selectedTimeSlot,
    setSelectedTimeSlot,
    email,
    setEmail,
    sessionDuration,
    setSessionDuration,
    selectedStartTime,
    setSelectedStartTime,
    availableStartTimes,
    calculatedCost,
    
    handleTimeSlotSelect,
    handleStartTimeChange,
    handleDurationChange,
    getMaxDuration,
    getFinalBookingSlot,
    getSessionTimeRange,
    formatTimeForDisplay: formatTimeDisplay // Alias the function to match the expected name
  };
}
