
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAvailabilityData } from "@/hooks/useAvailabilityData";
import { Tutor } from "@/types/tutor";
import { useScheduling, BookingStep } from "@/contexts/SchedulingContext";
import { DateSelector } from "./booking-modal/date-selector/DateSelector";
import { TimeSlotList } from "./booking-modal/time-slot/TimeSlotList";
import { Loader2, ArrowLeft, ArrowRight, Calendar, Check } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { CourseSelector } from "./booking-modal/course/CourseSelector";
import { SessionDurationSelector } from "./booking-modal/duration/SessionDurationSelector";
import { SessionTypeSelector } from "./booking-modal/session-type/SessionTypeSelector";
import { StudentInfoForm } from "./booking-modal/student-info/StudentInfoForm";
import { ConfirmationStep } from "./booking-modal/ConfirmationStep";
import { startOfDay } from "date-fns";

export interface BookSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutor: Tutor;
  initialDate?: Date;
  initialTime?: string;
}

export function BookSessionModal({
  isOpen,
  onClose,
  tutor,
  initialDate,
  initialTime
}: BookSessionModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const { state, dispatch, setTutor, continueToNextStep, goToPreviousStep } = useScheduling();
  
  // Initialize starting date
  const today = startOfDay(new Date());
  
  // Fetch availability data
  const { 
    loading, 
    availableSlots, 
    hasAvailability, 
    errorMessage,
    refreshAvailability
  } = useAvailabilityData(tutor, today);

  // Set the tutor in the scheduling context
  useEffect(() => {
    if (tutor && tutor.id) {
      setTutor(tutor);
    }
    
    // Initialize with initial date/time if provided
    if (initialDate) {
      setSelectedDate(initialDate);
      dispatch({ type: 'SELECT_DATE', payload: initialDate });
    }
  }, [tutor, setTutor, initialDate, dispatch]);

  // Debug log for tracking availability
  useEffect(() => {
    console.log(`BookSessionModal: ${availableSlots.length} slots available, loading: ${loading}`);
    
    // When loading completes with no slots, show a toast
    if (!loading && availableSlots.length === 0 && isOpen) {
      toast.error("No available slots found for this tutor");
    }
  }, [loading, availableSlots.length, isOpen]);

  const handleDateChange = (date: Date) => {
    console.log("Date changed to:", date);
    setSelectedDate(date);
    dispatch({ type: 'SELECT_DATE', payload: date });
  };

  const handleSelectSlot = (slot: any) => {
    console.log("Selected slot:", slot);
    dispatch({ type: 'SELECT_TIME_SLOT', payload: slot });
  };

  const handleClose = () => {
    // Reset the booking state when closing
    dispatch({ type: 'RESET' });
    onClose();
  };

  // Handler for moving to the next step
  const handleContinue = () => {
    console.log("Moving to next step from:", state.bookingStep);
    continueToNextStep();
  };

  // Handler for moving to the previous step
  const handleBack = () => {
    console.log("Moving to previous step from:", state.bookingStep);
    goToPreviousStep();
  };

  const renderStepContent = () => {
    switch (state.bookingStep) {
      case BookingStep.SELECT_DATE_TIME:
        return (
          <>
            <DateSelector 
              date={selectedDate}
              onDateChange={handleDateChange}
              availableSlots={availableSlots}
              isLoading={loading}
            />
            
            {selectedDate && (
              <TimeSlotList
                slots={availableSlots}
                onSelectSlot={handleSelectSlot}
                selectedSlot={state.selectedTimeSlot}
                selectedDate={selectedDate}
              />
            )}
          </>
        );
        
      case BookingStep.SELECT_DURATION:
        return (
          <SessionDurationSelector
            selectedDuration={state.selectedDuration}
            onDurationChange={(duration) => dispatch({ type: 'SET_DURATION', payload: duration })}
            sessionTimeRange={state.selectedTimeSlot ? {
              start: state.selectedTimeSlot.start,
              end: state.selectedTimeSlot.end
            } : undefined}
            calculatedCost={state.selectedTimeSlot ? 
              (tutor.hourlyRate / 60) * state.selectedDuration : undefined}
            onBack={handleBack}
            onContinue={handleContinue}
          />
        );
        
      case BookingStep.SELECT_COURSE:
        return (
          <CourseSelector 
            selectedCourseId={state.selectedCourseId}
            onCourseSelect={(courseId) => dispatch({ type: 'SET_COURSE', payload: courseId })}
            tutor={tutor}
            onBack={handleBack}
            onContinue={handleContinue}
          />
        );
        
      case BookingStep.SELECT_SESSION_TYPE:
        return (
          <SessionTypeSelector 
            onBack={handleBack}
            onContinue={handleContinue}
          />
        );
        
      case BookingStep.FILL_FORM:
        return (
          <StudentInfoForm 
            onBack={handleBack}
            onContinue={handleContinue}
          />
        );
        
      case BookingStep.CONFIRMATION:
        return (
          <ConfirmationStep />
        );
        
      default:
        return <div>Unknown step</div>;
    }
  };

  const getStepTitle = (): string => {
    switch (state.bookingStep) {
      case BookingStep.SELECT_DATE_TIME:
        return "Select Date & Time";
      case BookingStep.SELECT_DURATION:
        return "Select Session Duration";
      case BookingStep.SELECT_COURSE:
        return "Select Course";
      case BookingStep.SELECT_SESSION_TYPE:
        return "Session Location";
      case BookingStep.FILL_FORM:
        return "Your Details";
      case BookingStep.CONFIRMATION:
        return "Confirm Your Booking";
      default:
        return "Book a Session";
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal mr-2" />
              <p>Loading available times...</p>
            </div>
          ) : !hasAvailability ? (
            <div className="text-center py-8">
              <p className="text-lg font-medium mb-2">No Availability Found</p>
              <p className="text-muted-foreground mb-4">
                {errorMessage || "This tutor hasn't set their availability yet."}
              </p>
              <Button 
                variant="outline" 
                onClick={refreshAvailability}
                className="mx-auto"
              >
                Retry
              </Button>
            </div>
          ) : (
            <>
              {renderStepContent()}
              
              {/* Only show navigation buttons for the first and last steps - all others manage their own navigation */}
              {state.bookingStep === BookingStep.SELECT_DATE_TIME && (
                <div className="flex justify-between mt-6 pt-4 border-t">
                  <div></div>
                  <Button 
                    className="bg-usc-cardinal hover:bg-usc-cardinal-dark"
                    onClick={handleContinue}
                    disabled={!state.selectedTimeSlot}
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
              
              {state.bookingStep === BookingStep.CONFIRMATION && (
                <div className="flex justify-between mt-6 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                  <Button 
                    className="bg-usc-cardinal hover:bg-usc-cardinal-dark"
                    onClick={() => {
                      toast.success("Session booked successfully!");
                      handleClose();
                    }}
                  >
                    Confirm Booking
                    <Check className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
