
import { format } from "date-fns";
import { BookingSlot } from "@/lib/scheduling-utils";
import { Tutor } from "@/types/tutor";
import { Calendar, Clock, DollarSign } from "lucide-react";

interface SessionDetailsDisplayProps {
  tutor: Tutor;
  selectedSlot: BookingSlot;
}

export const SessionDetailsDisplay = ({ tutor, selectedSlot }: SessionDetailsDisplayProps) => {
  // Calculate session duration and cost
  const startTime = new Date(`2000-01-01T${selectedSlot.start}`);
  const endTime = new Date(`2000-01-01T${selectedSlot.end}`);
  const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  const sessionCost = tutor.hourlyRate * durationHours;
  
  return (
    <div className="mb-6 p-4 bg-muted rounded-lg">
      <h3 className="font-medium mb-3">Session Details</h3>
      <div className="space-y-2">
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
          <span>{format(selectedSlot.day, 'EEEE, MMMM d, yyyy')}</span>
        </div>
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
          <span>
            {selectedSlot.start} - {selectedSlot.end} ({(durationHours * 60).toFixed(0)} minutes)
          </span>
        </div>
        <div className="flex items-center">
          <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
          <span>
            ${tutor.hourlyRate.toFixed(2)}/hour × {durationHours.toFixed(1)} hours = ${sessionCost.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
