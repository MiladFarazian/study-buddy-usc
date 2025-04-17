
import { useState, useCallback, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling/types";
import { CalendarSection } from "@/components/scheduling/BookingCalendar/CalendarSection";
import { useAvailabilityData } from "@/hooks/useAvailabilityData";
import { DurationSelector } from "./duration/DurationSelector";

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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<BookingSlot | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(60); // Default: 1 hour
  const [timeSlots, setTimeSlots] = useState<BookingSlot[]>([]);
  const { toast } = useToast();
  
  const hourlyRate = tutor.hourlyRate || 25; // Default to $25/hour if not set
  
  // Use our hook to fetch availability data
  const { 
    loading, 
    availableSlots, 
    hasAvailability, 
    errorMessage, 
    getConsecutiveSlots 
  } = useAvailabilityData(tutor, selectedDate);

  // When date changes, update the time slots
  useEffect(() => {
    if (availableSlots.length > 0) {
      // Filter slots for the selected date
      const slotsForSelectedDate = availableSlots.filter(slot => {
        const slotDay = slot.day instanceof Date ? slot.day : new Date(slot.day);
        return slotDay.toDateString() === selectedDate.toDateString();
      });
      
      // Only show available slots
      const availableSlotsForDate = slotsForSelectedDate.filter(slot => slot.available);
      
      // Sort by start time
      availableSlotsForDate.sort((a, b) => a.start.localeCompare(b.start));
      
      setTimeSlots(availableSlotsForDate);
      
      // Reset selected time slot when date changes
      setSelectedTimeSlot(null);
    }
  }, [selectedDate, availableSlots]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      // Move to time selection after date is selected
      setStep('time');
    }
  };
  
  const handleTimeSelect = (timeSlot: BookingSlot) => {
    setSelectedTimeSlot(timeSlot);
    // Reset duration when time changes
    setSelectedDuration(60);
    // Move to duration selection
    setStep('duration');
  };
  
  const handleDurationSelect = (duration: number) => {
    setSelectedDuration(duration);
  };
  
  const handleBack = () => {
    switch (step) {
      case 'time':
        setStep('date');
        break;
      case 'duration':
        setStep('time');
        break;
      default:
        setStep('date');
    }
  };
  
  const handleContinue = () => {
    if (step === 'duration' && selectedTimeSlot) {
      // Here we need to create the final booking slot with the selected duration
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

  // Render content based on current step
  const renderStepContent = () => {
    switch (step) {
      case 'date':
        return (
          <CalendarSection 
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            availableSlots={availableSlots}
          />
        );
      
      case 'time':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Select Time</h2>
            
            {timeSlots.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No available time slots for this date.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {timeSlots.map((slot, index) => (
                  <button
                    key={`${slot.start}-${index}`}
                    className={`
                      p-3 rounded-md border text-center transition-colors
                      ${selectedTimeSlot?.start === slot.start ? 
                        'bg-red-50 border-usc-cardinal text-usc-cardinal' : 
                        'hover:border-usc-cardinal hover:bg-red-50/50'}
                    `}
                    onClick={() => handleTimeSelect(slot)}
                    disabled={disabled}
                  >
                    {slot.start}
                  </button>
                ))}
              </div>
            )}
            
            <div className="flex justify-between mt-6">
              <button 
                className="px-4 py-2 border rounded-md"
                onClick={handleBack}
                disabled={disabled}
              >
                Back
              </button>
              
              <button
                className="px-4 py-2 bg-usc-cardinal text-white rounded-md disabled:opacity-50"
                onClick={() => selectedTimeSlot && setStep('duration')}
                disabled={!selectedTimeSlot || disabled}
              >
                Continue
              </button>
            </div>
          </div>
        );
      
      case 'duration':
        return (
          <DurationSelector
            selectedSlot={selectedTimeSlot!}
            durationOptions={durationOptions}
            selectedDuration={selectedDuration}
            onSelectDuration={handleDurationSelect}
            onBack={handleBack}
            onContinue={handleContinue}
            hourlyRate={hourlyRate}
            consecutiveSlots={consecutiveSlots} // Pass consecutive slots to the component
          />
        );
      
      default:
        return null;
    }
  };

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

  return <div className="min-h-[400px]">{renderStepContent()}</div>;
}
