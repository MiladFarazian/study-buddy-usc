
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScheduling } from "@/contexts/SchedulingContext";
import { formatTimeDisplay } from "@/lib/scheduling/time-utils";
import { format } from "date-fns";

interface ConfirmationStepProps {
  onClose: () => void;
}

export function ConfirmationStep({ onClose }: ConfirmationStepProps) {
  const { state, tutor } = useScheduling();
  
  if (!state.selectedDate || !state.selectedTimeSlot || !tutor) {
    return null;
  }
  
  const sessionDate = format(state.selectedDate, 'EEEE, MMMM d, yyyy');
  const sessionTime = `${formatTimeDisplay(state.selectedTimeSlot.start)} - ${formatTimeDisplay(state.selectedTimeSlot.end)}`;
  
  return (
    <div className="text-center py-4 space-y-6">
      <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
      
      <div>
        <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
        <p className="text-muted-foreground">
          Your session with {tutor.name} has been successfully booked.
        </p>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-md text-left">
        <h3 className="font-semibold text-lg mb-2">Session Details</h3>
        <ul className="space-y-2">
          <li className="flex justify-between">
            <span className="text-muted-foreground">Date:</span>
            <span>{sessionDate}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-muted-foreground">Time:</span>
            <span>{sessionTime}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-muted-foreground">Duration:</span>
            <span>{state.selectedDuration} minutes</span>
          </li>
        </ul>
      </div>
      
      <div className="pt-4">
        <p className="text-sm text-muted-foreground mb-4">
          You'll receive an email confirmation with all the details.
        </p>
        <Button 
          onClick={onClose}
          className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
        >
          Close
        </Button>
      </div>
    </div>
  );
}
