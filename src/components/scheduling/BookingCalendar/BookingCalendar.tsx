
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling";
import { CalendarSection } from "./CalendarSection";
import { TimeSlotSection } from "./TimeSlotSection";
import { LoadingState } from "./LoadingState";
import { NoAvailabilityState } from "./NoAvailabilityState";
import { useBookingAvailability } from "./hooks/useBookingAvailability";

interface BookingCalendarProps {
  tutor: Tutor;
  onSelectSlot: (slot: BookingSlot) => void;
}

export const BookingCalendar = ({ tutor, onSelectSlot }: BookingCalendarProps) => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  
  const { 
    loading, 
    availableSlots, 
    visibleSlots, 
    hasAvailability, 
    loadAvailability 
  } = useBookingAvailability(tutor, selectedDate);

  useEffect(() => {
    if (tutor.id) {
      loadAvailability();
    }
  }, [tutor.id]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      console.log('BookingCalendar: Date selected:', format(date, 'yyyy-MM-dd'));
      setSelectedDate(date);
    }
  };

  const handleSelectSlot = (slot: BookingSlot) => {
    if (!slot.available) return;
    
    setSelectedSlot(slot);
    onSelectSlot(slot);
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!hasAvailability) {
    return <NoAvailabilityState />;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Book a Session</CardTitle>
        <CardDescription>
          Select a date and time for your tutoring session with {tutor.firstName || tutor.name.split(' ')[0]}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CalendarSection 
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            availableSlots={availableSlots}
          />
          
          <TimeSlotSection 
            visibleSlots={visibleSlots}
            selectedSlot={selectedSlot}
            handleSelectSlot={handleSelectSlot}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Rate: ${tutor.hourlyRate.toFixed(2)}/hour
        </p>
      </CardFooter>
    </Card>
  );
};
