
import { Card, CardContent } from "@/components/ui/card";
import { Tutor } from "@/types/tutor";
import { LoadingState } from "./booking-wizard/LoadingState";
import { StepNavigation } from "./booking-wizard/StepNavigation";
import { WeeklyAvailabilityCalendar } from "./calendar/weekly/WeeklyAvailabilityCalendar";
import { useEffect, useState } from "react";
import { useScheduling } from "@/contexts/SchedulingContext";
import { BookingSlot, WeeklyAvailability } from "@/lib/scheduling/types";
import { DurationStep } from "./booking-wizard/steps/DurationStep";
import { DateStep } from "./booking-wizard/steps/DateStep";
import { TimeStep } from "./booking-wizard/steps/TimeStep";
import { ConfirmationStep } from "./booking-wizard/steps/ConfirmationStep";
import { format } from "date-fns";
import { toast } from "sonner";

interface NewBookingWizardProps {
  tutor: Tutor;
  onClose: () => void;
  initialDate?: Date;
  initialTime?: string;
}

export function NewBookingWizard({ tutor, onClose, initialDate, initialTime }: NewBookingWizardProps) {
  const { setTutor, state, dispatch, calculatePrice } = useScheduling();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('date');
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [timeSlots, setTimeSlots] = useState<Array<{ start: string; available: boolean }>>([]);
  const [creating, setCreating] = useState(false);
  const [notes, setNotes] = useState("");
  
  // Set the tutor in the context when the component mounts
  useEffect(() => {
    if (tutor) {
      setTutor(tutor);
      // Load availability data here
      setTimeout(() => {
        setLoading(false);
        // Mock data for now
        setAvailableDates([new Date(), new Date(Date.now() + 86400000), new Date(Date.now() + 86400000 * 2)]);
        setTimeSlots([
          { start: "09:00", available: true },
          { start: "10:00", available: true },
          { start: "11:00", available: true },
          { start: "13:00", available: true },
          { start: "14:00", available: true },
          { start: "15:00", available: false },
          { start: "16:00", available: true },
        ]);
      }, 1000);
    }
  }, [tutor, setTutor]);

  // Set initial date and time if provided
  useEffect(() => {
    if (initialDate) {
      dispatch({ type: 'SELECT_DATE', payload: initialDate });
    }
    if (initialTime) {
      // Create a booking slot with the initial time
      dispatch({ 
        type: 'SELECT_TIME_SLOT', 
        payload: { 
          day: initialDate || new Date(), 
          start: initialTime,
          end: "", // This will be calculated later based on duration
          available: true,
          tutorId: tutor.id
        } 
      });
    }
  }, [initialDate, initialTime, dispatch, tutor.id]);

  const handleBack = () => {
    switch (step) {
      case "time":
        setStep("date");
        break;
      case "duration":
        setStep("time");
        break;
      case "confirm":
        setStep("duration");
        break;
      default:
        onClose();
    }
  };

  const hourlyRate = tutor.hourlyRate || 60;
  const durationOptions = [
    { minutes: 30, cost: Math.round(hourlyRate * 0.5) },
    { minutes: 60, cost: hourlyRate },
    { minutes: 90, cost: Math.round(hourlyRate * 1.5) }
  ];

  const handleConfirmBooking = async () => {
    setCreating(true);
    try {
      // Simulate booking creation
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success("Booking successful!");
      onClose();
    } catch (error) {
      toast.error("Failed to create booking. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleContinue = () => {
    if (step === "date" && state.selectedDate) {
      setStep("time");
    } else if (step === "time" && state.selectedTimeSlot) {
      setStep("duration");
    } else if (step === "duration" && state.selectedDuration) {
      setStep("confirm");
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-4">
        <StepNavigation 
          onBack={handleBack} 
          backLabel={step === "date" ? "Back to Tutor Profile" : "Back"} 
        />

        {step === "date" && (
          <DateStep 
            selectedDate={state.selectedDate || undefined} 
            onDateChange={(date) => {
              dispatch({ type: 'SELECT_DATE', payload: date });
              setStep("time");
            }}
            availableDates={availableDates}
          />
        )}

        {step === "time" && state.selectedDate && (
          <TimeStep 
            timeSlots={timeSlots}
            selectedTime={state.selectedTimeSlot?.start || null}
            onTimeChange={(start) => dispatch({ 
              type: 'SELECT_TIME_SLOT', 
              payload: { 
                day: state.selectedDate as Date, 
                start, 
                end: "", 
                available: true,
                tutorId: tutor.id
              } 
            })}
            onContinue={() => setStep("duration")}
          />
        )}

        {step === "duration" && (
          <DurationStep 
            options={durationOptions}
            selectedDuration={state.selectedDuration}
            onDurationChange={(duration) => {
              dispatch({ type: 'SET_DURATION', payload: duration });
              setStep("confirm");
            }}
            hourlyRate={hourlyRate}
          />
        )}

        {step === "confirm" && state.selectedDate && state.selectedTimeSlot && state.selectedDuration && (
          <ConfirmationStep 
            selectedDate={state.selectedDate}
            selectedTime={state.selectedTimeSlot.start}
            selectedDuration={state.selectedDuration}
            cost={calculatePrice(state.selectedDuration)}
            notes={notes}
            onNotesChange={setNotes}
            onBack={handleBack}
            onConfirm={handleConfirmBooking}
            creating={creating}
          />
        )}
      </CardContent>
    </Card>
  );
}
