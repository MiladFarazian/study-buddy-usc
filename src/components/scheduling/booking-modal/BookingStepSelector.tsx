
import { useState, useEffect } from "react";
import { BookingSlot } from "@/lib/scheduling";
import { Tutor } from "@/types/tutor";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAvailabilityData } from "../calendar/useAvailabilityData";
import { DateSelector } from "./date-selector/DateSelector";
import { TimeSlotList } from "./time-slot/TimeSlotList";
import { SessionDurationSelector } from "./duration/SessionDurationSelector";
import { StudentInfoForm } from "./student-info/StudentInfoForm";
import { convertTimeToMinutes, convertMinutesToTime } from "../calendar/hooks/useTimeFormatting";

interface BookingStepSelectorProps {
  tutor: Tutor;
  onSelectSlot: (slot: BookingSlot) => void;
  onClose: () => void;
}

export const BookingStepSelector = ({ 
  tutor, 
  onSelectSlot, 
  onClose 
}: BookingStepSelectorProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<BookingSlot | null>(null);
  const [email, setEmail] = useState<string>("");
  const [sessionDuration, setSessionDuration] = useState<number>(60); // Default 60 minutes
  const [sessionStart, setSessionStart] = useState<string | null>(null);
  const [selectedStartTime, setSelectedStartTime] = useState<string>("");
  const [calculatedCost, setCalculatedCost] = useState<number | null>(null);
  const [availableStartTimes, setAvailableStartTimes] = useState<string[]>([]);
  
  const startDate = date || new Date();
  const { loading, availableSlots, hasAvailability, errorMessage } = useAvailabilityData(tutor, startDate);
  
  // Filter available slots for the selected date
  const availableTimeSlotsForDate = availableSlots.filter(slot => {
    if (!date) return false;
    const slotDate = new Date(slot.day);
    return (
      slotDate.toDateString() === date.toDateString() && 
      slot.available
    );
  });
  
  // Handle time slot selection
  const handleTimeSlotSelect = (slot: BookingSlot) => {
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
    calculateCost(defaultDuration, tutor.hourlyRate || 25);
  };
  
  // Handle start time selection
  const handleStartTimeChange = (startTime: string) => {
    setSelectedStartTime(startTime);
    setSessionStart(startTime);
    
    // Adjust max duration based on new start time
    if (selectedTimeSlot) {
      const startTimeMinutes = convertTimeToMinutes(startTime);
      const endTimeMinutes = convertTimeToMinutes(selectedTimeSlot.end);
      const maxPossibleDuration = endTimeMinutes - startTimeMinutes;
      
      // If current duration exceeds max possible, adjust it
      if (sessionDuration > maxPossibleDuration) {
        setSessionDuration(maxPossibleDuration);
        calculateCost(maxPossibleDuration, tutor.hourlyRate || 25);
      } else {
        // Recalculate session time range and cost with new start time
        calculateCost(sessionDuration, tutor.hourlyRate || 25);
      }
    }
  };
  
  // Helper function to convert time string to minutes
  const convertTimeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  // Helper function to convert minutes to time string (HH:MM)
  const convertMinutesToTime = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  
  // Calculate the cost based on duration and hourly rate
  const calculateCost = (durationMinutes: number, hourlyRate: number) => {
    const durationHours = durationMinutes / 60;
    const cost = hourlyRate * durationHours;
    setCalculatedCost(cost);
  };
  
  // Handle duration slider change
  const handleDurationChange = (value: number[]) => {
    if (!selectedTimeSlot || !value.length || !sessionStart) return;
    
    const newDuration = value[0];
    setSessionDuration(newDuration);
    
    // Calculate cost based on new duration
    calculateCost(newDuration, tutor.hourlyRate || 25);
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
      tutorId: tutor.id,
      day: selectedTimeSlot.day,
      start: sessionStart,
      end: endTime,
      available: true
    };
  };
  
  // Handle confirming the session booking
  const handleConfirmBooking = () => {
    const bookingSlot = getFinalBookingSlot();
    if (bookingSlot) {
      onSelectSlot(bookingSlot);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-usc-cardinal"></div>
        <span className="ml-2">Loading tutor availability...</span>
      </div>
    );
  }
  
  if (!hasAvailability || availableSlots.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto h-10 w-10 text-usc-cardinal mb-2" />
        <p className="text-muted-foreground mb-4">
          {errorMessage || "No availability found for this tutor."}
        </p>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }
  
  // Helper function to format time for displaying
  const formatTimeForDisplay = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  
  // Format time for displaying the session start and end times
  const getSessionTimeRange = (): string => {
    if (!sessionStart || !sessionDuration || !selectedTimeSlot) return '';
    
    const startMinutes = convertTimeToMinutes(sessionStart);
    const endMinutes = startMinutes + sessionDuration;
    const endTime = convertMinutesToTime(endMinutes);
    
    return `${formatTimeForDisplay(sessionStart)} - ${formatTimeForDisplay(endTime)}`;
  };
  
  return (
    <div className="space-y-6 py-2">
      <DateSelector 
        date={date} 
        onDateChange={setDate} 
        availableSlots={availableSlots} 
      />
      
      {date && availableTimeSlotsForDate.length > 0 && (
        <TimeSlotList 
          availableTimeSlots={availableTimeSlotsForDate}
          selectedTimeSlot={selectedTimeSlot}
          onSelectTimeSlot={handleTimeSlotSelect}
          formatTimeForDisplay={formatTimeForDisplay}
        />
      )}
      
      {selectedTimeSlot && (
        <SessionDurationSelector
          sessionTimeRange={getSessionTimeRange()}
          calculatedCost={calculatedCost}
          sessionDuration={sessionDuration}
          onDurationChange={handleDurationChange}
          onStartTimeChange={handleStartTimeChange}
          maxDuration={getMaxDuration()}
          hourlyRate={tutor.hourlyRate || 25}
          availableStartTimes={availableStartTimes}
          selectedStartTime={selectedStartTime}
          formatTimeForDisplay={formatTimeForDisplay}
        />
      )}
      
      <StudentInfoForm 
        email={email}
        onEmailChange={(e) => setEmail(e.target.value)}
      />
      
      <div className="pt-4 flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleConfirmBooking}
          disabled={!selectedTimeSlot || !sessionDuration}
          className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
        >
          Proceed to Payment
        </Button>
      </div>
    </div>
  );
};
