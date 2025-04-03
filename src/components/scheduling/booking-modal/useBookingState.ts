
import { useState, useCallback, useMemo } from 'react';
import { format, parseISO, addMinutes, differenceInMinutes } from 'date-fns';
import { BookingSlot } from '@/lib/scheduling/types';

export function useBookingState(initialDate?: Date, initialTime?: string) {
  const [date, setDate] = useState<Date | null>(initialDate || null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<BookingSlot | null>(null);
  const [sessionDuration, setSessionDuration] = useState(60); // Default: 1 hour
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(initialTime || null);
  const [email, setEmail] = useState('');
  const [calculatedCost, setCalculatedCost] = useState(0);

  // Calculate session start and end times based on the selected slot and duration
  const getSessionTimeRange = useCallback(() => {
    if (!selectedTimeSlot) return { start: '', end: '' };
    
    const startTime = selectedStartTime || selectedTimeSlot.start;
    const startDate = parseISO(`2000-01-01T${startTime}`);
    const endDate = addMinutes(startDate, sessionDuration);
    
    return {
      start: format(startDate, 'HH:mm'),
      end: format(endDate, 'HH:mm')
    };
  }, [selectedTimeSlot, sessionDuration, selectedStartTime]);
  
  // Format time for display (e.g., "09:00" to "9:00 AM")
  const formatTimeForDisplay = useCallback((time: string) => {
    try {
      const date = parseISO(`2000-01-01T${time}`);
      return format(date, 'h:mm a');
    } catch (error) {
      console.error("Error formatting time:", error, time);
      return time;
    }
  }, []);
  
  // Get the maximum duration available based on the selected time slot
  const getMaxDuration = useCallback(() => {
    if (!selectedTimeSlot) return 60;
    
    const start = selectedStartTime || selectedTimeSlot.start;
    const end = selectedTimeSlot.end;
    
    const startDate = parseISO(`2000-01-01T${start}`);
    const endDate = parseISO(`2000-01-01T${end}`);
    
    // Maximum duration in minutes
    return differenceInMinutes(endDate, startDate);
  }, [selectedTimeSlot, selectedStartTime]);
  
  // Get available start times within the selected time slot
  const availableStartTimes = useMemo(() => {
    if (!selectedTimeSlot) return [];
    
    const result = [];
    const startTime = parseISO(`2000-01-01T${selectedTimeSlot.start}`);
    const endTime = parseISO(`2000-01-01T${selectedTimeSlot.end}`);
    
    // Generate times at 15-minute intervals
    let currentTime = startTime;
    while (differenceInMinutes(endTime, currentTime) >= 30) { // Minimum session: 30 minutes
      result.push(format(currentTime, 'HH:mm'));
      currentTime = addMinutes(currentTime, 15);
    }
    
    return result;
  }, [selectedTimeSlot]);
  
  // Handle time slot selection
  const handleTimeSlotSelect = useCallback((slot: BookingSlot) => {
    setSelectedTimeSlot(slot);
    setSelectedStartTime(slot.start);
    
    // Calculate initial cost based on default duration
    const startDate = parseISO(`2000-01-01T${slot.start}`);
    const endDate = addMinutes(startDate, sessionDuration);
    
    // Check if the end time is after the slot's end time
    const slotEndDate = parseISO(`2000-01-01T${slot.end}`);
    if (endDate > slotEndDate) {
      // Adjust duration to fit within the slot
      const adjustedDuration = differenceInMinutes(slotEndDate, startDate);
      setSessionDuration(adjustedDuration);
    }
  }, [sessionDuration]);
  
  // Handle session duration change
  const handleDurationChange = useCallback((values: number[], hourlyRate: number) => {
    const newDuration = values[0];
    setSessionDuration(newDuration);
    
    // Update cost
    const cost = (hourlyRate / 60) * newDuration;
    setCalculatedCost(cost);
  }, []);
  
  // Handle start time change
  const handleStartTimeChange = useCallback((time: string, hourlyRate: number) => {
    setSelectedStartTime(time);
    
    if (!selectedTimeSlot) return;
    
    // Check if the current duration fits within the new start time
    const startDate = parseISO(`2000-01-01T${time}`);
    const endDate = addMinutes(startDate, sessionDuration);
    const slotEndDate = parseISO(`2000-01-01T${selectedTimeSlot.end}`);
    
    if (endDate > slotEndDate) {
      // Adjust duration to fit
      const adjustedDuration = differenceInMinutes(slotEndDate, startDate);
      setSessionDuration(adjustedDuration);
      
      // Update cost with adjusted duration
      const cost = (hourlyRate / 60) * adjustedDuration;
      setCalculatedCost(cost);
    } else {
      // Update cost with current duration
      const cost = (hourlyRate / 60) * sessionDuration;
      setCalculatedCost(cost);
    }
  }, [selectedTimeSlot, sessionDuration]);
  
  // Generate the final booking slot with all details
  const getFinalBookingSlot = useCallback((): BookingSlot | null => {
    if (!selectedTimeSlot || !date) return null;
    
    const { start, end } = getSessionTimeRange();
    
    // Calculate start and end times as Date objects
    const selectedDay = date;
    const startDateTime = new Date(selectedDay);
    const [startHours, startMinutes] = start.split(':').map(Number);
    startDateTime.setHours(startHours, startMinutes, 0, 0);
    
    const endDateTime = new Date(selectedDay);
    const [endHours, endMinutes] = end.split(':').map(Number);
    endDateTime.setHours(endHours, endMinutes, 0, 0);
    
    return {
      ...selectedTimeSlot,
      day: selectedDay,
      start,
      end,
      startTime: startDateTime,
      endTime: endDateTime,
      durationMinutes: sessionDuration,
      available: true
    };
  }, [selectedTimeSlot, date, getSessionTimeRange, sessionDuration]);
  
  return {
    date,
    setDate,
    selectedTimeSlot,
    email,
    setEmail,
    sessionDuration,
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
