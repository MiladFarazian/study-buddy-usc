
import { useState, useEffect } from "react";
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling";
import { useAvailabilityData } from "../calendar/useAvailabilityData";
import { DateSelector } from "./date-selector/DateSelector";
import { TimeSlotList } from "./time-slot/TimeSlotList";
import { SessionDurationSelector } from "./duration/SessionDurationSelector";
import { StudentInfoForm } from "./student-info/StudentInfoForm";
import { SlotSelectionFooter } from "./SlotSelectionFooter";
import { useBookingState } from "./useBookingState";
import { LoadingState } from "./LoadingState";
import { ErrorDisplay } from "./ErrorDisplay";
import { startOfDay, format } from "date-fns";

interface BookingStepSelectorProps {
  tutor: Tutor;
  onSelectSlot: (slot: BookingSlot) => void;
  onClose: () => void;
  initialDate?: Date;
  initialTime?: string;
}

export const BookingStepSelector = ({ 
  tutor, 
  onSelectSlot, 
  onClose,
  initialDate,
  initialTime
}: BookingStepSelectorProps) => {
  const {
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
  } = useBookingState(initialDate, initialTime);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const startDate = date || startOfDay(new Date());
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
  
  // When initial date and time are provided, pre-select the matching slot
  useEffect(() => {
    if (initialDate && initialTime && availableTimeSlotsForDate.length > 0 && !selectedTimeSlot) {
      const matchingSlot = availableTimeSlotsForDate.find(slot => {
        // Match the slot that contains the initial time
        const slotStartHour = parseInt(slot.start.split(':')[0]);
        const initialTimeHour = parseInt(initialTime.split(':')[0]);
        return slotStartHour === initialTimeHour;
      });
      
      if (matchingSlot) {
        handleTimeSlotSelect(matchingSlot);
      }
    }
  }, [initialDate, initialTime, availableTimeSlotsForDate, selectedTimeSlot, handleTimeSlotSelect]);
  
  // Handle confirming the session booking
  const handleConfirmBooking = () => {
    setIsSubmitting(true);
    const bookingSlot = getFinalBookingSlot();
    if (bookingSlot) {
      onSelectSlot(bookingSlot);
    }
    setIsSubmitting(false);
  };
  
  if (loading) {
    return <LoadingState />;
  }
  
  if (!hasAvailability || availableSlots.length === 0) {
    return (
      <ErrorDisplay 
        message={errorMessage || "No availability found for this tutor."} 
        onClose={onClose} 
      />
    );
  }
  
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
          onDurationChange={(values) => handleDurationChange(values, tutor.hourlyRate || 25)}
          onStartTimeChange={(time) => handleStartTimeChange(time, tutor.hourlyRate || 25)}
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
      
      <SlotSelectionFooter
        onProceed={handleConfirmBooking}
        onCancel={onClose}
        isLoading={isSubmitting}
        isDisabled={!selectedTimeSlot || !email}
      />
    </div>
  );
};
