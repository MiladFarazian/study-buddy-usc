
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

  // Generate a string key for the selected date to force re-render when selection changes
  const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : 'none';

  return (
    <div>
      <p className="text-sm font-medium mb-2">Select a Date:</p>
      <div className="min-h-[350px] w-full border rounded-md p-2 flex items-center justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateSelect}
          defaultMonth={selectedDate}
          month={selectedDate}
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
          className="w-full pointer-events-auto"
          classNames={{
            day_today: "ring-2 ring-usc-cardinal ring-inset rounded-md",
            day_selected: "bg-usc-cardinal text-white hover:bg-usc-cardinal-dark focus:bg-usc-cardinal-dark",
            day_disabled: "text-muted-foreground opacity-50",
            months: "w-full",
            month: "w-full",
            table: "w-full",
            head_row: "flex w-full justify-between",
            row: "flex w-full justify-between mt-2",
            cell: "h-8 w-8 text-center p-0 relative [&:has([aria-selected])]:bg-accent focus-within:relative focus-within:z-20"
          }}
        />
      </div>
    </div>
  );
};
