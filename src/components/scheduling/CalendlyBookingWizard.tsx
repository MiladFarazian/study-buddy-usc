
import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tutor } from "@/types/tutor";
import { useAvailabilityData } from "@/hooks/useAvailabilityData";
import { CalendlyDateSelector } from "./CalendlyDateSelector";
import { CalendlyTimeSlots } from "./CalendlyTimeSlots";
import { format, addDays, parseISO, isAfter, startOfDay } from 'date-fns';
import { BookingSlot, createSessionBooking } from "@/lib/scheduling";
import { Loader2 } from "lucide-react";

interface CalendlyBookingWizardProps {
  tutor: Tutor;
  onClose: () => void;
}

export function CalendlyBookingWizard({ tutor, onClose }: CalendlyBookingWizardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<BookingSlot | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  
  // Get availability data
  const today = startOfDay(new Date());
  const { loading, availableSlots, hasAvailability, errorMessage } = useAvailabilityData(tutor, today);
  
  // Extract all available dates
  const availableDates = availableSlots
    .filter(slot => slot.available)
    .map(slot => slot.day)
    .filter((date, index, self) => 
      index === self.findIndex(d => 
        d.getDate() === date.getDate() && 
        d.getMonth() === date.getMonth() && 
        d.getFullYear() === date.getFullYear()
      )
    );
  
  // Handle selecting a time slot
  const handleSelectTimeSlot = (slot: BookingSlot) => {
    setSelectedTimeSlot(slot);
  };
  
  // Handle booking session
  const handleBookSession = async () => {
    if (!user || !selectedTimeSlot) return;
    
    setIsBooking(true);
    
    try {
      // Parse start time
      const startDate = new Date(selectedTimeSlot.day);
      const [startHour, startMin] = selectedTimeSlot.start.split(':').map(Number);
      startDate.setHours(startHour, startMin, 0, 0);
      
      // Set end time (30 mins after start)
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + 30);
      
      // Create booking
      await createSessionBooking(
        user.id,
        tutor.id,
        null, // courseId
        startDate.toISOString(),
        endDate.toISOString(),
        null, // location
        null  // notes
      );
      
      toast({
        title: "Session Booked!",
        description: `Your session with ${tutor.name} has been scheduled.`,
      });
      
      onClose();
    } catch (error) {
      console.error("Error booking session:", error);
      toast({
        title: "Booking Failed",
        description: "There was an error booking your session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };
  
  // Handle date selection from CalendlyDateSelector
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal mb-4" />
        <p>Loading available times...</p>
      </div>
    );
  }
  
  if (!hasAvailability || availableSlots.length === 0) {
    return (
      <div className="py-6 text-center">
        <h2 className="text-xl font-semibold mb-4">No Availability</h2>
        <p className="text-muted-foreground mb-6">
          {errorMessage || `${tutor.name} doesn't have any available slots right now.`}
        </p>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-center mb-6">
        Book a Session with {tutor.name}
      </h1>
      
      <CalendlyDateSelector 
        availableDates={availableDates} 
        showWeekMonth={true}
      />
      
      <CalendlyTimeSlots 
        availableSlots={availableSlots}
      />
      
      {selectedTimeSlot && (
        <div className="border-t pt-6 mt-8">
          <div className="flex justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Session Duration</p>
              <p className="font-medium">30 minutes</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="font-medium">${((tutor.hourlyRate || 25) / 2).toFixed(2)}</p>
            </div>
          </div>
          
          <Button 
            className="w-full bg-usc-cardinal hover:bg-usc-cardinal-dark"
            onClick={handleBookSession}
            disabled={isBooking}
          >
            {isBooking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Booking Session...
              </>
            ) : (
              'Confirm Booking'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
