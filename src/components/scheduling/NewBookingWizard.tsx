
import { Card, CardContent } from "@/components/ui/card";
import { Tutor } from "@/types/tutor";
import { LoadingState } from "./booking-wizard/LoadingState";
import { StepNavigation } from "./booking-wizard/StepNavigation";
import { useBookingWizard } from "./booking-wizard/hooks/useBookingWizard";
import { DateStep } from "./booking-wizard/steps/DateStep";
import { TimeStep } from "./booking-wizard/steps/TimeStep";
import { DurationStep } from "./booking-wizard/steps/DurationStep";
import { ConfirmationStep } from "./booking-wizard/steps/ConfirmationStep";
import { useEffect } from "react";
import { useScheduling } from "@/contexts/SchedulingContext";

interface NewBookingWizardProps {
  tutor: Tutor;
  onClose: () => void;
  initialDate?: Date;
  initialTime?: string;
}

export function NewBookingWizard({ tutor, onClose, initialDate, initialTime }: NewBookingWizardProps) {
  const { setTutor } = useScheduling();
  
  // Set the tutor in the context when the component mounts
  useEffect(() => {
    if (tutor) {
      setTutor(tutor);
    }
  }, [tutor, setTutor]);
  
  const {
    step,
    setStep,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    selectedDuration,
    setSelectedDuration,
    notes,
    setNotes,
    availableTimeSlots,
    availableDates,
    loading,
    creating,
    handleConfirmBooking
  } = useBookingWizard(tutor);

  // Set initial date and time if provided
  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
    }
    if (initialTime) {
      setSelectedTime(initialTime);
    }
  }, [initialDate, initialTime, setSelectedDate, setSelectedTime]);

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

  if (loading) {
    return <LoadingState />;
  }

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <StepNavigation 
          onBack={handleBack} 
          backLabel={step === "date" ? "Back to Tutor Profile" : "Back"} 
        />

        {step === "date" && (
          <DateStep 
            selectedDate={selectedDate} 
            onDateChange={(date) => {
              setSelectedDate(date);
              setStep("time");
            }}
            availableDates={availableDates}
          />
        )}

        {step === "time" && selectedDate && (
          <TimeStep 
            timeSlots={availableTimeSlots}
            selectedTime={selectedTime}
            onTimeChange={setSelectedTime}
            onContinue={() => setStep("duration")}
          />
        )}

        {step === "duration" && (
          <DurationStep 
            options={durationOptions}
            selectedDuration={selectedDuration}
            onDurationChange={(duration) => {
              setSelectedDuration(duration);
              setStep("confirm");
            }}
            hourlyRate={hourlyRate}
          />
        )}

        {step === "confirm" && selectedDate && selectedTime && selectedDuration && (
          <ConfirmationStep 
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            selectedDuration={selectedDuration}
            cost={durationOptions.find(opt => opt.minutes === selectedDuration)?.cost || 0}
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
