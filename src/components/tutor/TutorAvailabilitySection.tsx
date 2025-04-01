
import { useState } from "react";
import { TutorAvailabilityCard } from "../scheduling/TutorAvailabilityCard";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendlyBookingWizard } from "../scheduling/CalendlyBookingWizard";
import { Tutor } from "@/types/tutor";
import { SchedulingProvider } from "@/contexts/SchedulingContext";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { SchedulerModal } from "@/components/scheduling/SchedulerModal";

interface TutorAvailabilitySectionProps {
  tutor: Tutor;
}

export const TutorAvailabilitySection = ({ tutor }: TutorAvailabilitySectionProps) => {
  const { toast } = useToast();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<{ start: string; end: string } | null>(null);

  const handleSelectTimeSlot = (date: Date, startTime: string, endTime: string) => {
    setSelectedDate(date);
    setSelectedTime({ start: startTime, end: endTime });
    
    toast({
      title: "Time Selected",
      description: `${format(date, 'MMM d')} from ${startTime} to ${endTime}. Click Book a Session to proceed.`
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">Availability</h2>
          <p className="text-muted-foreground">
            Check when {tutor.firstName || tutor.name.split(' ')[0]} is available for tutoring
          </p>
        </div>
        <Button 
          onClick={() => setShowBookingModal(true)}
          className="mt-3 sm:mt-0 bg-usc-cardinal hover:bg-usc-cardinal-dark"
        >
          <Calendar className="mr-2 h-4 w-4" />
          Book a Session
        </Button>
      </div>

      <TutorAvailabilityCard 
        tutorId={tutor.id} 
        readOnly={false} 
        onSelectTimeSlot={handleSelectTimeSlot} 
      />

      {selectedDate && selectedTime && (
        <div className="bg-usc-gold/20 p-4 rounded-md mt-4">
          <h3 className="font-medium mb-2">Selected Time Slot</h3>
          <p>
            {format(selectedDate, 'EEEE, MMMM d, yyyy')} from {selectedTime.start} to {selectedTime.end}
          </p>
          <Button 
            className="mt-3 bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
            onClick={() => setShowBookingModal(true)}
          >
            Book This Time
          </Button>
        </div>
      )}

      <SchedulerModal 
        isOpen={showBookingModal} 
        onClose={() => setShowBookingModal(false)}
        tutor={tutor}
        initialDate={selectedDate || undefined}
        initialTime={selectedTime?.start}
      />
    </div>
  );
};
