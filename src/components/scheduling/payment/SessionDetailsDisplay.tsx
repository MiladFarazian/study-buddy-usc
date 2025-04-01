
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling/types";
import { format } from "date-fns";
import { User, Clock, Calendar, CreditCard } from "lucide-react";

interface SessionDetailsDisplayProps {
  tutor: Tutor;
  selectedSlot: BookingSlot;
}

export const SessionDetailsDisplay = ({ tutor, selectedSlot }: SessionDetailsDisplayProps) => {
  // Calculate session cost based on tutor hourly rate and duration
  const calculateSessionCost = () => {
    if (!tutor.hourlyRate) return 25; // Default rate if not set
    
    const startTime = new Date(`2000-01-01T${selectedSlot.start}`);
    const endTime = new Date(`2000-01-01T${selectedSlot.end}`);
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    
    return tutor.hourlyRate * durationHours;
  };
  
  const sessionCost = calculateSessionCost();
  const formattedDate = format(selectedSlot.day, "EEEE, MMMM d, yyyy");
  
  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
      <h3 className="font-medium text-lg mb-2">Session Details</h3>
      
      <div className="space-y-3">
        <div className="flex items-center">
          <User className="h-5 w-5 mr-3 text-muted-foreground" />
          <span>{tutor.name}</span>
        </div>
        
        <div className="flex items-center">
          <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
          <span>{formattedDate}</span>
        </div>
        
        <div className="flex items-center">
          <Clock className="h-5 w-5 mr-3 text-muted-foreground" />
          <span>{selectedSlot.start} - {selectedSlot.end}</span>
        </div>
        
        <div className="flex items-center pt-2 border-t">
          <CreditCard className="h-5 w-5 mr-3 text-muted-foreground" />
          <div className="flex justify-between items-center w-full">
            <span className="font-medium">Total:</span>
            <span className="font-medium">${sessionCost.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
