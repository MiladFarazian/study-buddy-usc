
import { useState, useEffect, useCallback } from "react";
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling";
import { useAvailabilityData } from "@/hooks/useAvailabilityData";
import { DateSelector } from "./date-selector/DateSelector";
import { TimeSlotList } from "./time-slot/TimeSlotList";
import { SessionDurationSelector } from "./duration/SessionDurationSelector";
import { StudentInfoForm } from "./student-info/StudentInfoForm";
import { SlotSelectionFooter } from "./SlotSelectionFooter";
import { useBookingState } from "./useBookingState";
import { LoadingState } from "./LoadingState";
import { ErrorDisplay } from "./ErrorDisplay";
import { startOfDay, format, isSameDay } from "date-fns";

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
  const { loading, availableSlots, hasAvailability, errorMessage, refreshAvailability } = useAvailabilityData(tutor, startDate);
  
  // Filter available slots for the selected date
  const availableTimeSlotsForDate = useCallback(() => {
    if (!date) return [];
    
    return availableSlots.filter(slot => {
      const slotDate = slot.day instanceof Date ? slot.day : new Date(slot.day as string);
      return (
        slotDate.toDateString() === date.toDateString() && 
        slot.available
      );
    });
  }, [date, availableSlots]);
  
  const timeSlotsForSelectedDate = availableTimeSlotsForDate();
  
  // When initial date and time are provided, pre-select the matching slot
  useEffect(() => {
    if (initialDate && initialTime && availableSlots.length > 0 && !selectedTimeSlot) {
      const matchingSlot = availableSlots.find(slot => {
        // Match the slot that contains the initial time
        const slotDate = slot.day instanceof Date ? slot.day : new Date(slot.day as string);
        if (!isSameDay(slotDate, initialDate)) return false;
        const slotStartHour = parseInt(slot.start.split(':')[0]);
        const initialTimeHour = parseInt(initialTime.split(':')[0]);
        return slotStartHour === initialTimeHour;
      });
      
      if (matchingSlot) {
        handleTimeSlotSelect(matchingSlot);
      }
    }
  }, [initialDate, initialTime, availableSlots, selectedTimeSlot, handleTimeSlotSelect]);
  
  // Handle confirming the session booking
  const handleConfirmBooking = () => {
    setIsSubmitting(true);
    try {
      const bookingSlot = getFinalBookingSlot();
      if (bookingSlot) {
        onSelectSlot(bookingSlot);
      }
    } catch (error) {
      console.error("Error creating booking slot:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading && availableSlots.length === 0) {
    return <LoadingState />;
  }
  
  if (!hasAvailability && !loading) {
    return (
      <ErrorDisplay 
        message={errorMessage || "No availability found for this tutor."} 
        onClose={onClose} 
      />
    );
  }
  
  return (
    <div className="space-y-6 w-full">
      <DateSelector 
        date={date} 
        onDateChange={setDate} 
        availableSlots={availableSlots}
        isLoading={loading}
      />
      
      {date && (
        <TimeSlotList 
          availableTimeSlots={timeSlotsForSelectedDate}
          selectedTimeSlot={selectedTimeSlot}
          selectedDuration={sessionDuration}
          onSelectTimeSlot={handleTimeSlotSelect}
          formatTimeForDisplay={formatTimeForDisplay}
          isLoading={loading}
        />
      )}
      
      {selectedTimeSlot && (
        <SessionDurationSelector
          sessionTimeRange={getSessionTimeRange()}
          calculatedCost={calculatedCost}
          sessionDuration={sessionDuration}
          onDurationChange={(duration) => handleDurationChange(duration, tutor.hourlyRate || 25)}
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
      
      <SlotSelectionFooter
        onProceed={handleConfirmBooking}
        onCancel={onClose}
        isLoading={isSubmitting || loading}
        isDisabled={!selectedTimeSlot || !email}
      />
    </div>
  );
};
