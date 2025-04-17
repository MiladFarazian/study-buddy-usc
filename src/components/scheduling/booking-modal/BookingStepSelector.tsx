
import { useState, useCallback, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling/types";
import { useAvailabilityData } from "@/hooks/useAvailabilityData";
import { DurationSelector } from "./duration/DurationSelector";
import { DateSelector } from "./date-selector/DateSelector";
import { format, isSameDay } from 'date-fns';

interface BookingStepSelectorProps {
  tutor: Tutor;
  onSelectSlot: (slot: BookingSlot) => void;
  onClose: () => void;
  disabled?: boolean;
}

type BookingStep = 'date' | 'time' | 'duration' | 'payment';

export function BookingStepSelector({ 
  tutor, 
  onSelectSlot, 
  onClose, 
  disabled = false 
}: BookingStepSelectorProps) {
  const [step, setStep] = useState<BookingStep>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<BookingSlot | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(60); // Default: 1 hour
  const { toast } = useToast();
  
  const hourlyRate = tutor.hourlyRate || 25; // Default to $25/hour if not set
  
  // Use our hook to fetch availability data with a key that changes when the date changes
  // to force a refresh when the date is changed
  const dateKey = selectedDate ? selectedDate.toISOString() : 'initial';
  const { 
    loading, 
    availableSlots, 
    hasAvailability, 
    errorMessage, 
    getConsecutiveSlots 
  } = useAvailabilityData(tutor, selectedDate || new Date());

  const handleDateChange = (date: Date) => {
    // Reset time slot when date changes
    setSelectedTimeSlot(null);
    setSelectedDate(date);
    // Return to date selection step
    setStep('date');
  };
  
  const handleSelectTimeSlot = (slot: BookingSlot) => {
    setSelectedTimeSlot(slot);
    // Reset duration when time changes
    setSelectedDuration(60);
    // Move to duration selection
    setStep('duration');
  };
  
  const handleDurationSelect = (duration: number) => {
    setSelectedDuration(duration);
  };
  
  const handleBack = () => {
    if (step === 'duration') {
      setStep('date');
    }
  };
  
  const handleContinue = () => {
    if (step === 'duration' && selectedTimeSlot) {
      // Create the final booking slot with the selected duration
      const finalSlot: BookingSlot = {
        ...selectedTimeSlot,
        durationMinutes: selectedDuration
      };
      
      // Call the parent handler
      onSelectSlot(finalSlot);
    }
  };

  // Calculate cost based on duration and hourly rate
  const calculateCost = (durationMinutes: number): number => {
    return (hourlyRate / 60) * durationMinutes;
  };

  // Generate duration options
  const durationOptions = [
    { minutes: 30, cost: calculateCost(30) },
    { minutes: 60, cost: calculateCost(60) },
    { minutes: 90, cost: calculateCost(90) }
  ];
  
  // Get consecutive slots for the selected time slot
  const consecutiveSlots = selectedTimeSlot 
    ? getConsecutiveSlots(selectedTimeSlot, 180) // Check for up to 3 hours (180 minutes)
    : [];
    
  // Check if there are available time slots for the selected date
  const hasSlotsForSelectedDate = selectedDate 
    ? availableSlots.some(slot => {
        const slotDay = slot.day instanceof Date ? slot.day : new Date(slot.day);
        return isSameDay(slotDay, selectedDate) && slot.available;
      })
    : false;

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-usc-cardinal"></div>
          <span className="ml-2">Loading availability...</span>
        </div>
      </Card>
    );
  }

  if (!hasAvailability) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No Availability</h3>
          <p className="text-muted-foreground mb-6">
            {errorMessage || "This tutor doesn't have any available slots."}
          </p>
          <button
            className="px-4 py-2 bg-usc-cardinal text-white rounded-md"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="min-h-[400px]">
      {step === 'date' ? (
        <div className="space-y-6">
          <DateSelector
            date={selectedDate}
            onDateChange={handleDateChange}
            availableSlots={availableSlots}
            isLoading={loading}
          />
          
          {selectedDate && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Available Time Slots</h3>
              
              {hasSlotsForSelectedDate ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableSlots
                    .filter(slot => {
                      const slotDay = slot.day instanceof Date ? slot.day : new Date(slot.day);
                      return isSameDay(slotDay, selectedDate) && slot.available;
                    })
                    .sort((a, b) => a.start.localeCompare(b.start))
                    .map((slot, index) => (
                      <button
                        key={`${slot.start}-${index}`}
                        className={`
                          p-3 rounded-md border text-center transition-colors
                          hover:border-usc-cardinal hover:bg-red-50/50
                          ${selectedTimeSlot && selectedTimeSlot.start === slot.start ? 
                            'border-usc-cardinal bg-red-50' : ''}
                        `}
                        onClick={() => handleSelectTimeSlot(slot)}
                        disabled={disabled}
                      >
                        {slot.start}
                      </button>
                    ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/30 rounded-md">
                  <p className="text-muted-foreground">No available time slots on {format(selectedDate, 'EEEE, MMMM d')}</p>
                  <p className="text-muted-foreground text-sm mt-2">Please select another date from the calendar.</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : step === 'duration' ? (
        <DurationSelector
          selectedSlot={selectedTimeSlot!}
          durationOptions={durationOptions}
          selectedDuration={selectedDuration}
          onSelectDuration={handleDurationSelect}
          onBack={handleBack}
          onContinue={handleContinue}
          hourlyRate={hourlyRate}
          consecutiveSlots={consecutiveSlots}
        />
      ) : null}
    </div>
  );
}
