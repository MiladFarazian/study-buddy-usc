
import { useState } from "react";
import { TutorAvailabilityCard } from "../scheduling/TutorAvailabilityCard";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { Tutor } from "@/types/tutor";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { SchedulerModal } from "@/components/scheduling/SchedulerModal";
import { Badge } from "@/components/ui/badge";

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
        <div className="bg-muted p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-3">Selected Time Slot</h3>
          <div className="space-y-2 mb-4">
            <div className="flex items-center">
              <span className="font-medium w-24">Date:</span>
              <span>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium w-24">Time:</span>
              <span>{selectedTime.start} to {selectedTime.end}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium w-24">Duration:</span>
              <span>1 hour</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium w-24">Rate:</span>
              <span>${tutor.hourlyRate || 25}/hour</span>
            </div>
          </div>
          
          <div className="flex gap-3 mt-4">
            <Button 
              className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
              onClick={() => setShowBookingModal(true)}
            >
              Book This Time
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setSelectedDate(null);
                setSelectedTime(null);
              }}
            >
              Clear Selection
            </Button>
          </div>
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
