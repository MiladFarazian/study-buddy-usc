import React, { useState, useEffect } from 'react';
import { BookingAvailabilityCalendar } from '../BookingAvailabilityCalendar';
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Tutor } from "@/types/tutor";
import { getTutorAvailability, getTutorBookedSessions } from "@/lib/scheduling";
import { WeeklyAvailability } from "@/lib/scheduling/types/availability";
import { BookedSession } from "@/lib/scheduling/types/booking";
import { addDays } from 'date-fns';
import { LoadingState } from '../BookingCalendar/LoadingState';

interface CalendarDateTimeStepProps {
  tutor: Tutor;
  selectedDate: Date | undefined;
  selectedTime: string | undefined;
  onDateTimeChange: (date: Date, time: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function CalendarDateTimeStep({
  tutor,
  selectedDate,
  selectedTime,
  onDateTimeChange,
  onContinue,
  onBack
}: CalendarDateTimeStepProps) {
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<WeeklyAvailability>({});
  const [bookedSessions, setBookedSessions] = useState<BookedSession[]>([]);
  const [hasAvailability, setHasAvailability] = useState(true);

  useEffect(() => {
    loadData();
  }, [tutor.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load tutor's availability
      const tutorAvailability = await getTutorAvailability(tutor.id);
      if (!tutorAvailability) {
        setHasAvailability(false);
        return;
      }

      // Check if there's any actual availability
      const hasAnySlots = Object.values(tutorAvailability).some(daySlots => 
        Array.isArray(daySlots) && daySlots.length > 0
      );
      
      if (!hasAnySlots) {
        setHasAvailability(false);
        return;
      }

      setAvailability(tutorAvailability);

      // Load booked sessions
      const today = new Date();
      const sessions = await getTutorBookedSessions(tutor.id, today, addDays(today, 28));
      setBookedSessions(sessions);

    } catch (error) {
      console.error("Error loading availability data:", error);
      setHasAvailability(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDateTime = (date: Date, hour: number) => {
    const timeString = `${hour.toString().padStart(2, '0')}:00`;
    onDateTimeChange(date, timeString);
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!hasAvailability) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">
          This tutor hasn't set up their availability yet.
        </p>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>
    );
  }

  const hasValidSelection = selectedDate && selectedTime;

  return (
    <div className="space-y-6">
      <BookingAvailabilityCalendar
        availability={availability}
        bookedSessions={bookedSessions}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onSelectDateTime={handleSelectDateTime}
        onContinue={onContinue}
      />
      
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={onContinue}
          disabled={!hasValidSelection}
          className="bg-usc-cardinal hover:bg-usc-cardinal-dark"
        >
          Continue to Duration
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}