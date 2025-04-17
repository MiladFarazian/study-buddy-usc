
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tutor } from "@/types/tutor";
import { DateSelector } from "@/lib/scheduling/ui/DateSelector";
import { TimeSelector } from "@/lib/scheduling/ui/TimeSelector";
import { DurationSelector } from "@/lib/scheduling/ui/DurationSelector";
import { BookingSummary } from "@/lib/scheduling/ui/BookingSummary";
import { LoadingState } from "./booking-wizard/LoadingState";
import { StepNavigation } from "./booking-wizard/StepNavigation";
import { useBookingWizard } from "./booking-wizard/hooks/useBookingWizard";

interface NewBookingWizardProps {
  tutor: Tutor;
  onClose: () => void;
}

export function NewBookingWizard({ tutor, onClose }: NewBookingWizardProps) {
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
          backLabel={step === "date" ? "Back to Tutors" : "Back"} 
        />

        {step === "date" && (
          <DateSelector 
            selectedDate={selectedDate} 
            onDateChange={(date) => {
              setSelectedDate(date);
              setStep("time");
            }}
            availableDates={availableDates}
          />
        )}

        {step === "time" && selectedDate && (
          <>
            <TimeSelector 
              timeSlots={availableTimeSlots}
              selectedTime={selectedTime}
              onTimeChange={setSelectedTime}
            />
            
            <div className="mt-8 flex justify-end">
              <Button 
                className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
                disabled={!selectedTime}
                onClick={() => selectedTime && setStep("duration")}
              >
                Continue
              </Button>
            </div>
          </>
        )}

        {step === "duration" && (
          <>
            <DurationSelector 
              options={durationOptions}
              selectedDuration={selectedDuration}
              onDurationChange={(duration) => {
                setSelectedDuration(duration);
                setStep("confirm");
              }}
              hourlyRate={hourlyRate}
            />
          </>
        )}

        {step === "confirm" && selectedDate && selectedTime && selectedDuration && (
          <>
            <BookingSummary 
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              durationMinutes={selectedDuration}
              cost={durationOptions.find(opt => opt.minutes === selectedDuration)?.cost || 0}
              notes={notes}
              onNotesChange={setNotes}
            />
            
            <div className="mt-8 flex justify-between">
              <Button variant="outline" onClick={handleBack} disabled={creating}>
                Back
              </Button>
              <Button 
                className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
                onClick={handleConfirmBooking}
                disabled={creating}
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
