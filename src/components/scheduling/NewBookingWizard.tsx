
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Tutor } from "@/types/tutor";
import { format, parseISO, addMinutes } from "date-fns";
import { 
  createSessionBooking,
  createPaymentTransaction,
  getTutorAvailability, 
  getTutorBookedSessions
} from "@/lib/scheduling";
import { generateSmartAvailableSlots } from "@/lib/scheduling/availability-utils";
import { 
  DateSelector,
  TimeSelector,
  DurationSelector,
  BookingSummary
} from "@/lib/scheduling";
import { BookingSlot } from "@/lib/scheduling/types/booking";
import { TimeSlot } from "@/lib/scheduling/ui/TimeSelector";
import { DurationOption } from "@/lib/scheduling/ui/DurationSelector";

interface NewBookingWizardProps {
  tutor: Tutor;
  onClose: () => void;
}

type BookingStep = "date" | "time" | "duration" | "confirm";

export function NewBookingWizard({ tutor, onClose }: NewBookingWizardProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<BookingStep>("date");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);

  const hourlyRate = tutor.hourlyRate || 60;
  
  const durationOptions: DurationOption[] = [
    { minutes: 30, cost: Math.round(hourlyRate * 0.5) },
    { minutes: 60, cost: hourlyRate },
    { minutes: 90, cost: Math.round(hourlyRate * 1.5) }
  ];

  useEffect(() => {
    if (tutor.id) {
      loadAvailability();
    }
  }, [tutor.id]);

  useEffect(() => {
    if (selectedDate) {
      loadTimeSlotsForDate(selectedDate);
    }
  }, [selectedDate]);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      const availability = await getTutorAvailability(tutor.id);
      
      if (!availability) {
        toast({
          title: "No Availability",
          description: "This tutor hasn't set their availability yet.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      const today = new Date();
      const bookedSessions = await getTutorBookedSessions(tutor.id, today, addMinutes(today, 60 * 28));
      
      const slots = generateSmartAvailableSlots(availability, bookedSessions, today, 28, 8);
      
      const slotsWithTutor = slots.map(slot => ({
        ...slot,
        tutorId: tutor.id
      }));
      
      const dates = slotsWithTutor
        .filter(slot => slot.available)
        .map(slot => {
          return slot.day instanceof Date ? slot.day : new Date(slot.day);
        });
      
      const uniqueDates = Array.from(
        new Set(
          dates.map(d => d.toDateString())
        )
      ).map(dateStr => new Date(dateStr));
      
      setAvailableDates(uniqueDates);
      
      if (!selectedDate && uniqueDates.length > 0) {
        setSelectedDate(uniqueDates[0]);
      }
    } catch (error) {
      console.error("Error loading tutor availability:", error);
      toast({
        title: "Error",
        description: "Failed to load tutor's availability.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTimeSlotsForDate = async (date: Date) => {
    try {
      const availability = await getTutorAvailability(tutor.id);
      
      if (!availability) return;
      
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const bookedSessions = await getTutorBookedSessions(tutor.id, startOfDay, endOfDay);
      
      const slots = generateSmartAvailableSlots(availability, bookedSessions, startOfDay, 1, 8);
      
      const timeSlots: TimeSlot[] = slots
        .filter(slot => slot.available)
        .map(slot => ({
          time: slot.start,
          available: true
        }));
      
      timeSlots.sort((a, b) => a.time.localeCompare(b.time));
      
      setAvailableTimeSlots(timeSlots);
      
      setSelectedTime(null);
    } catch (error) {
      console.error("Error loading time slots:", error);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setStep("time");
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep("duration");
  };

  const handleDurationSelect = (minutes: number) => {
    setSelectedDuration(minutes);
    setStep("confirm");
  };

  const handleConfirmBooking = async () => {
    if (!user || !selectedDate || !selectedTime || !selectedDuration) {
      toast({
        title: "Error",
        description: "Missing required information for booking.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    
    try {
      const sessionDate = format(selectedDate, 'yyyy-MM-dd');
      const startTime = `${sessionDate}T${selectedTime}:00`;
      
      const startDate = parseISO(startTime);
      const endDate = addMinutes(startDate, selectedDuration);
      const endTime = endDate.toISOString();
      
      // Validate user is not the tutor
      if (user.id === tutor.id) {
        toast({
          title: "Error",
          description: "Tutors cannot book sessions with themselves",
          variant: "destructive",
        });
        return;
      }
      
      const session = await createSessionBooking(
        user.id,
        tutor.id,
        null,
        startTime,
        endTime,
        null,
        notes || null
      );
      
      if (!session) throw new Error("Failed to create session");
      
      const durationHours = selectedDuration / 60;
      const sessionCost = hourlyRate * durationHours;
      
      await createPaymentTransaction(
        session.id,
        user.id,
        tutor.id,
        sessionCost
      );
      
      toast({
        title: "Booking Confirmed",
        description: "Your session has been successfully booked!",
      });
      
      navigate('/schedule');
      
    } catch (error) {
      console.error("Error creating session:", error);
      toast({
        title: "Error",
        description: "Failed to create the session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-usc-cardinal"></div>
            <span className="ml-2">Loading availability...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack} className="pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {step === "date" ? "Back to Tutors" : "Back"}
          </Button>
        </div>

        {step === "date" && (
          <DateSelector 
            selectedDate={selectedDate} 
            onDateChange={handleDateSelect}
            availableDates={availableDates}
          />
        )}

        {step === "time" && selectedDate && (
          <>
            <TimeSelector 
              timeSlots={availableTimeSlots}
              selectedTime={selectedTime}
              onTimeChange={handleTimeSelect}
            />
            
            <div className="mt-8 flex justify-end">
              <Button 
                className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
                disabled={!selectedTime}
                onClick={() => selectedTime && handleTimeSelect(selectedTime)}
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
              onDurationChange={handleDurationSelect}
              hourlyRate={hourlyRate}
            />
            
            <div className="mt-8 flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button 
                className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
                disabled={!selectedDuration}
                onClick={() => selectedDuration && handleDurationSelect(selectedDuration)}
              >
                Continue
              </Button>
            </div>
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
