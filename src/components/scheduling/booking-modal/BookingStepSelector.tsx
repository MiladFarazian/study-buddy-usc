
import { useState, useEffect } from "react";
import { format, addDays, startOfToday, isBefore, isToday } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TimeSlotList } from "./time-slot/TimeSlotList";
import { useAvailabilityData } from "@/hooks/useAvailabilityData";
import { BookingSlot } from "@/lib/scheduling/types";
import { Tutor } from "@/types/tutor";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingState } from "./LoadingState";
import { DateSelector } from "./date-selector/DateSelector";
import { ConfirmationStep } from "./ConfirmationStep";
import { useAuthState } from "@/hooks/useAuthState";
import { createSessionBooking } from "@/lib/scheduling";
import { toast } from "sonner";

export interface BookingStepSelectorProps {
  tutor: Tutor;
  onSelectSlot: (slot: BookingSlot) => void;
  onClose: () => void;
  disabled?: boolean;
}

type BookingStep = "select-date-time" | "confirm" | "processing" | "complete";

export function BookingStepSelector({ tutor, onSelectSlot, onClose, disabled }: BookingStepSelectorProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [step, setStep] = useState<BookingStep>("select-date-time");
  const [isBooking, setIsBooking] = useState(false);
  const { loading, availableSlots, hasAvailability, errorMessage, refreshAvailability } = useAvailabilityData(tutor, selectedDate);
  const { user } = useAuthState();
  const today = startOfToday();
  
  // Filter out past dates and slots
  const validAvailableSlots = availableSlots.filter(slot => {
    const slotDay = slot.day instanceof Date ? slot.day : new Date(slot.day);
    
    // Filter out past dates
    if (isBefore(slotDay, today)) return false;
    
    // If it's today, filter out past time slots
    if (isToday(slotDay)) {
      const now = new Date();
      const [hour, minute] = slot.start.split(':').map(Number);
      const slotTime = new Date();
      slotTime.setHours(hour, minute, 0, 0);
      
      return !isBefore(slotTime, now);
    }
    
    return slot.available;
  });
  
  // Filter slots for the selected date
  const slotsForSelectedDate = validAvailableSlots.filter(slot => {
    const slotDay = slot.day instanceof Date ? slot.day : new Date(slot.day);
    return slotDay.toDateString() === selectedDate.toDateString() && slot.available;
  });

  // Handle slot selection
  const handleSelectTimeSlot = (slot: BookingSlot) => {
    setSelectedSlot(slot);
    setStep("confirm");
  };

  // Handle booking confirmation
  const handleConfirmBooking = async () => {
    if (!user || !selectedSlot) {
      toast.error("You must be logged in to book a session");
      return;
    }

    setIsBooking(true);
    
    try {
      // Extract day and time info from selected slot
      const day = selectedSlot.day instanceof Date ? selectedSlot.day : new Date(selectedSlot.day);
      
      // Create start time
      const startTime = new Date(day);
      const [startHour, startMinute] = selectedSlot.start.split(':').map(Number);
      startTime.setHours(startHour, startMinute, 0, 0);
      
      // Create end time
      const endTime = new Date(day);
      const [endHour, endMinute] = selectedSlot.end.split(':').map(Number);
      endTime.setHours(endHour, endMinute, 0, 0);
      
      // Create session in database
      await createSessionBooking(
        user.id,
        tutor.id,
        null, // No course ID
        startTime.toISOString(),
        endTime.toISOString(),
        null, // No location
        null // No notes
      );
      
      toast.success("Session booked successfully!");
      setStep("complete");
      
      // Refresh availability data to reflect the booked slot
      refreshAvailability();
    } catch (error) {
      console.error("Error booking session:", error);
      toast.error("Failed to book session. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  // Handle navigation based on step
  const goBack = () => {
    if (step === "confirm") {
      setStep("select-date-time");
    }
  };

  if (loading) {
    return <LoadingState message="Loading tutor's availability..." />;
  }

  // Render appropriate content based on current step
  const renderStepContent = () => {
    switch (step) {
      case "select-date-time":
        return (
          <div className="space-y-6">
            <DateSelector
              date={selectedDate}
              onDateChange={setSelectedDate}
              availableSlots={availableSlots}
              isLoading={false}
            />
            
            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            
            <TimeSlotList 
              slots={slotsForSelectedDate}
              onSelectSlot={handleSelectTimeSlot}
              selectedSlot={selectedSlot}
              disabled={disabled || isBooking}
            />
            
            {selectedSlot && (
              <div className="flex justify-end">
                <Button 
                  className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
                  onClick={() => setStep("confirm")}
                  disabled={isBooking || !selectedSlot}
                >
                  Continue
                </Button>
              </div>
            )}
          </div>
        );
        
      case "confirm":
        if (!selectedSlot) return null;
        
        const slotDay = selectedSlot.day instanceof Date ? selectedSlot.day : new Date(selectedSlot.day);
        const formattedDate = format(slotDay, 'EEEE, MMMM d, yyyy');
        const formattedTime = `${selectedSlot.start} - ${selectedSlot.end}`;
        
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-center">Confirm Your Booking</h2>
            
            <div className="bg-muted/30 p-6 rounded-lg space-y-4">
              <div className="flex flex-col items-center mb-4">
                <div className="relative w-20 h-20 rounded-full bg-usc-cardinal/10 mb-2 flex items-center justify-center">
                  {tutor.imageUrl ? (
                    <img 
                      src={tutor.imageUrl} 
                      alt={tutor.name} 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="text-3xl font-bold text-usc-cardinal">
                      {tutor.name.charAt(0)}
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-semibold">{tutor.name}</h3>
                <p className="text-muted-foreground">{tutor.subjects?.map(s => s.name).join(', ') || 'Tutor'}</p>
              </div>
              
              <div className="space-y-3 divide-y">
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">{formattedDate}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-medium">{formattedTime}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-medium">${tutor.hourlyRate?.toFixed(2) || '25.00'}/hour</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={goBack} disabled={isBooking}>
                Back
              </Button>
              <Button 
                className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
                onClick={handleConfirmBooking}
                disabled={isBooking || !user}
              >
                {isBooking ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Processing...
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </Button>
            </div>
            
            {!user && (
              <Alert variant="warning" className="mt-4">
                <AlertDescription>
                  You need to be logged in to book a session.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );
        
      case "complete":
        if (!selectedSlot) return null;
        return (
          <ConfirmationStep 
            tutor={tutor} 
            selectedSlot={selectedSlot} 
            onClose={onClose}
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {renderStepContent()}
    </div>
  );
}
