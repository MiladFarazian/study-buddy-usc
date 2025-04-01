
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
  const { loading, availableSlots, hasAvailability, errorMessage, refreshAvailability } = useAvailabilityData(tutor, startDate);
  
  // Filter available slots for the selected date
  const availableTimeSlotsForDate = useCallback(() => {
    if (!date) return [];
    
    return availableSlots.filter(slot => {
      const slotDate = new Date(slot.day);
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
        if (!isSameDay(new Date(slot.day), initialDate)) return false;
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
  
  // Use isSameDay helper function
  function isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
  
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
    <div className="space-y-6 py-2 w-full">
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
        isLoading={isSubmitting || loading}
        isDisabled={!selectedTimeSlot || !email}
      />
    </div>
  );
};
