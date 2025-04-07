
import { Calendar } from "@/components/ui/calendar";
import { addDays, format, parseISO } from "date-fns";
import { BookingSlot } from "@/lib/scheduling";

interface CalendarSectionProps {
  selectedDate: Date;
  onDateSelect: (date: Date | undefined) => void;
  availableSlots: BookingSlot[];
}

export const CalendarSection = ({ 
  selectedDate, 
  onDateSelect, 
  availableSlots 
}: CalendarSectionProps) => {
  // Get the dates with available slots for the calendar
  const getDatesWithSlots = () => {
    const dates = new Set<string>();
    availableSlots.forEach(slot => {
      if (slot.available) {
        const slotDay = slot.day instanceof Date ? slot.day : new Date(slot.day);
        dates.add(format(slotDay, 'yyyy-MM-dd'));
      }
    });
    return Array.from(dates).map(dateStr => parseISO(dateStr));
  };

  return (
    <div>
      <p className="text-sm font-medium mb-2">Select a Date:</p>
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onDateSelect}
        disabled={(date) => {
          // Disable dates before today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (date < today) return true;
          
          // Disable dates more than 4 weeks in the future
          const fourWeeksFromNow = addDays(today, 28);
          if (date > fourWeeksFromNow) return true;
          
          // Disable dates with no available slots
          const dateStr = format(date, 'yyyy-MM-dd');
          return !getDatesWithSlots().some(d => format(d, 'yyyy-MM-dd') === dateStr);
        }}
        className="rounded-md border"
      />
    </div>
  );
};
