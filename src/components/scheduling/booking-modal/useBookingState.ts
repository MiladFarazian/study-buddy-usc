
import { useState } from "react";
import { BookingSlot } from "@/lib/scheduling";
import { convertTimeToMinutes, convertMinutesToTime } from "../calendar/hooks/useTimeFormatting";

export function useBookingState() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<BookingSlot | null>(null);
  const [email, setEmail] = useState<string>("");
  const [sessionDuration, setSessionDuration] = useState<number>(60); // Default 60 minutes
  const [sessionStart, setSessionStart] = useState<string | null>(null);
  const [selectedStartTime, setSelectedStartTime] = useState<string>("");
  const [calculatedCost, setCalculatedCost] = useState<number | null>(null);
  const [availableStartTimes, setAvailableStartTimes] = useState<string[]>([]);

  // Handle time slot selection
  const handleTimeSlotSelect = (slot: BookingSlot) => {
    if (!slot) return;
    
    setSelectedTimeSlot(slot);
    
    // Generate available start times in 15-minute increments
    const startTimeMinutes = convertTimeToMinutes(slot.start);
    const endTimeMinutes = convertTimeToMinutes(slot.end);
    const maxDuration = endTimeMinutes - startTimeMinutes;
    
    const startTimes: string[] = [];
    // Generate start times in 15-minute increments, leaving at least 15 minutes for session
    for (let time = startTimeMinutes; time < endTimeMinutes - 15; time += 15) {
      startTimes.push(convertMinutesToTime(time));
    }
    
    setAvailableStartTimes(startTimes);
    
    // Set default start time to the beginning of the slot
    const defaultStartTime = slot.start;
    setSelectedStartTime(defaultStartTime);
    setSessionStart(defaultStartTime);
    
    // Set default duration to 60 minutes or max available time if less
    const defaultDuration = Math.min(60, maxDuration);
    setSessionDuration(defaultDuration);
    
    // Calculate cost based on duration
    calculateCost(defaultDuration, slot.tutorId ? 25 : 25); // Default rate
  };
  
  // Handle start time selection
  const handleStartTimeChange = (startTime: string, hourlyRate: number = 25) => {
    if (!startTime || !selectedTimeSlot) return;
    
    setSelectedStartTime(startTime);
    setSessionStart(startTime);
    
    // Adjust max duration based on new start time
    const startTimeMinutes = convertTimeToMinutes(startTime);
    const endTimeMinutes = convertTimeToMinutes(selectedTimeSlot.end);
    const maxPossibleDuration = endTimeMinutes - startTimeMinutes;
    
    // If current duration exceeds max possible, adjust it
    if (sessionDuration > maxPossibleDuration) {
      setSessionDuration(maxPossibleDuration);
      calculateCost(maxPossibleDuration, hourlyRate);
    } else {
      // Recalculate session time range and cost with new start time
      calculateCost(sessionDuration, hourlyRate);
    }
  };
  
  // Calculate the cost based on duration and hourly rate
  const calculateCost = (durationMinutes: number, hourlyRate: number) => {
    const durationHours = durationMinutes / 60;
    const cost = hourlyRate * durationHours;
    setCalculatedCost(cost);
  };
  
  // Handle duration slider change
  const handleDurationChange = (value: number[], hourlyRate: number = 25) => {
    if (!selectedTimeSlot || !value || !value.length || !sessionStart) return;
    
    const newDuration = value[0];
    setSessionDuration(newDuration);
    
    // Calculate cost based on new duration
    calculateCost(newDuration, hourlyRate);
  };
  
  // Get the maximum possible duration for the selected time slot and start time
  const getMaxDuration = (): number => {
    if (!selectedTimeSlot || !sessionStart) return 180; // Default max 3 hours
    
    const startTimeMinutes = convertTimeToMinutes(sessionStart);
    const endTimeMinutes = convertTimeToMinutes(selectedTimeSlot.end);
    
    // Cap at 3 hours or max available
    return Math.min(180, endTimeMinutes - startTimeMinutes);
  };
  
  // Function to get the final booking slot based on selected duration
  const getFinalBookingSlot = (): BookingSlot | null => {
    if (!selectedTimeSlot || !sessionStart || !sessionDuration) return null;
    
    const startMinutes = convertTimeToMinutes(sessionStart);
    const endMinutes = startMinutes + sessionDuration;
    const endTime = convertMinutesToTime(endMinutes);
    
    return {
      tutorId: selectedTimeSlot.tutorId,
      day: selectedTimeSlot.day,
      start: sessionStart,
      end: endTime,
      available: true
    };
  };

  // Format time for displaying the session start and end times
  const getSessionTimeRange = (): string => {
    if (!sessionStart || !sessionDuration || !selectedTimeSlot) return '';
    
    const startMinutes = convertTimeToMinutes(sessionStart);
    const endMinutes = startMinutes + sessionDuration;
    const endTime = convertMinutesToTime(endMinutes);
    
    return `${formatTimeForDisplay(sessionStart)} - ${formatTimeForDisplay(endTime)}`;
  };

  // Helper function to format time for displaying
  const formatTimeForDisplay = (time24: string): string => {
    if (!time24) return '';
    
    try {
      const [hours, minutes] = time24.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (error) {
      console.error("Error formatting time:", error);
      return time24;
    }
  };

  return {
    date,
    setDate,
    selectedTimeSlot,
    email,
    setEmail,
    sessionDuration,
    sessionStart,
    calculatedCost,
    selectedStartTime,
    availableStartTimes,
    handleTimeSlotSelect,
    handleStartTimeChange,
    handleDurationChange,
    getMaxDuration,
    getFinalBookingSlot,
    getSessionTimeRange,
    formatTimeForDisplay
  };
}
