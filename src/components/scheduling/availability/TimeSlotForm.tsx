
import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WeeklyAvailability } from "@/lib/scheduling/types";

// Generate time slots in 30-minute increments (6 AM - 11 PM only)
const TIME_SLOTS = Array.from({ length: 17 * 2 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6; // Start at 6 AM
  const minute = (i % 2) * 30;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
});

interface TimeSlotFormProps {
  selectedDay: string;
  selectedStart: string;
  selectedEnd: string;
  setSelectedStart: (time: string) => void;
  setSelectedEnd: (time: string) => void;
  addTimeSlot: () => void;
  readOnly: boolean;
}

export const TimeSlotForm: React.FC<TimeSlotFormProps> = ({
  selectedDay,
  selectedStart,
  selectedEnd,
  setSelectedStart,
  setSelectedEnd,
  addTimeSlot,
  readOnly
}) => {
  // Format time for display (12-hour format with AM/PM)
  const formatTimeForDisplay = (time: string) => {
    const [hourStr, minuteStr] = time.split(':');
    const hour = parseInt(hourStr);
    const minute = minuteStr;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute} ${period}`;
  };

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold capitalize">{selectedDay}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Add your available time slots for this day. Hours are restricted to 6:00 AM - 11:00 PM for reasonable tutoring times.
      </p>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Select value={selectedStart} onValueChange={setSelectedStart}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Start" />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.map((time) => (
                <SelectItem key={`start-${time}`} value={time}>
                  {formatTimeForDisplay(time)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>to</span>
          <Select value={selectedEnd} onValueChange={setSelectedEnd}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="End" />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.map((time) => (
                <SelectItem key={`end-${time}`} value={time}>
                  {formatTimeForDisplay(time)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={addTimeSlot} className="mt-2 md:mt-0" disabled={readOnly}>
          <Plus className="h-4 w-4 mr-2" />
          Add Time Slot
        </Button>
      </div>
    </div>
  );
}
