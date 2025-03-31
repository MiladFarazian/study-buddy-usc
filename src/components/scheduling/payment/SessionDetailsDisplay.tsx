import { format, differenceInMinutes, parseISO } from "date-fns";
import { CalendarDays, Clock, DollarSign } from "lucide-react";
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling/types";
import { Separator } from "@/components/ui/separator";

interface SessionDetailsDisplayProps {
  tutor: Tutor;
  selectedSlot: BookingSlot;
}

export const SessionDetailsDisplay = ({ 
  tutor, 
  selectedSlot 
}: SessionDetailsDisplayProps) => {
  // Calculate duration and cost
  const startTime = parseISO(`2000-01-01T${selectedSlot.start}`);
  const endTime = parseISO(`2000-01-01T${selectedSlot.end}`);
  const durationMinutes = differenceInMinutes(endTime, startTime);
  const durationHours = durationMinutes / 60;
  const sessionCost = tutor.hourlyRate * durationHours;
  
  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-lg font-medium">Session Details</h3>
      
      <div className="bg-gray-50 rounded-md p-4 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm">
              {format(selectedSlot.day, 'EEEE, MMMM d, yyyy')}
            </span>
          </div>
          
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm">
              {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
            </span>
          </div>
        </div>
        
        <div className="flex items-center">
          <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-sm">
            ${tutor.hourlyRate.toFixed(2)}/hour • {durationHours.toFixed(1)} hours
          </span>
        </div>
      </div>
      
      <Separator />
      
      <div className="flex justify-between font-medium">
        <span>Total</span>
        <span>${sessionCost.toFixed(2)}</span>
      </div>
    </div>
  );
};
