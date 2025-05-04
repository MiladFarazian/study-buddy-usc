
import { Calendar } from "@/components/ui/calendar";
import { BookingSlot } from "@/lib/scheduling/types";
import { CalendarIcon } from "lucide-react";
import { format, isEqual, parseISO } from "date-fns";
import { useEffect, useMemo } from "react";

interface DateSelectorProps {
  date: Date | undefined;
  onDateChange: (date: Date) => void;
  availableSlots: BookingSlot[];
  isLoading?: boolean;
  className?: string;
}

export function DateSelector({
  date,
  onDateChange,
  availableSlots,
  isLoading = false,
  className
}: DateSelectorProps) {
  // Get all available dates from the slots
  const availableDates = useMemo(() => {
    console.log("DateSelector rendering with", availableSlots.length, "available slots");
    const dates = new Set<string>();
    
    availableSlots.forEach(slot => {
      if (slot.available) {
        const slotDate = slot.day instanceof Date ? slot.day : new Date(slot.day);
        dates.add(format(slotDate, 'yyyy-MM-dd'));
      }
    });
    
    return Array.from(dates).map(dateStr => parseISO(dateStr));
  }, [availableSlots]);

  // Set first available date if none is selected
  useEffect(() => {
    if (!date && availableDates.length > 0 && !isLoading) {
      onDateChange(availableDates[0]);
    }
  }, [date, availableDates, onDateChange, isLoading]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold flex items-center">
          <CalendarIcon className="mr-2 h-5 w-5" />
          Select a Date
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Choose an available date for your tutoring session.
        </p>
      </div>
      
      <div className={`border rounded-md p-4 ${className || ''}`}>
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => selectedDate && onDateChange(selectedDate)}
          disabled={(calendarDate) => {
            // Check if this date is in our available dates
            return !availableDates.some(availableDate => 
              format(availableDate, 'yyyy-MM-dd') === format(calendarDate, 'yyyy-MM-dd')
            );
          }}
          initialFocus={true}
          className="mx-auto"
        />
      </div>
    </div>
  );
}
