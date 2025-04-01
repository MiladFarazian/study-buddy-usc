
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, isToday, isSameDay, startOfMonth, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { BookingSlot } from "@/lib/scheduling";
import type { DayContentProps } from "react-day-picker";

interface DateSelectorProps {
  date: Date | undefined;
  onDateChange: (date: Date) => void;
  availableSlots: BookingSlot[];
}

export const DateSelector = ({ 
  date, 
  onDateChange, 
  availableSlots 
}: DateSelectorProps) => {
  const [month, setMonth] = useState<Date>(date || new Date());
  
  // Function to check if a date has any available slots
  const hasAvailableSlots = (day: Date) => {
    return availableSlots.some(slot => 
      isSameDay(new Date(slot.day), day) && slot.available
    );
  };
  
  // Handle month navigation
  const handlePrevMonth = () => {
    setMonth(prevMonth => subMonths(prevMonth, 1));
  };
  
  const handleNextMonth = () => {
    setMonth(prevMonth => addMonths(prevMonth, 1));
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Select a Date</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Calendar
        mode="single"
        selected={date}
        onSelect={onDateChange}
        month={month}
        onMonthChange={setMonth}
        className="rounded-md border"
        classNames={{
          day_today: "bg-muted",
          day_selected: "bg-usc-cardinal text-white hover:bg-usc-cardinal-dark focus:bg-usc-cardinal-dark",
          day_disabled: "text-muted-foreground opacity-50"
        }}
        modifiersClassNames={{
          today: "text-usc-gold font-bold",
          selected: "bg-usc-cardinal text-white",
        }}
        modifiers={{
          available: (day) => hasAvailableSlots(day)
        }}
        components={{
          Day: (props: DayContentProps) => {
            // Get the date from props
            const dayDate = props.date;
            // Check if this date has available slots
            const isAvailable = hasAvailableSlots(dayDate);
            // Check if this date is selected
            const isSelected = date ? isSameDay(dayDate, date) : false;
            
            return (
              <div
                className={cn(
                  "relative p-0",
                  !isAvailable && "opacity-50"
                )}
              >
                <button
                  type="button"
                  className={cn(
                    "h-10 w-10 p-0 font-normal aria-selected:opacity-100",
                    isAvailable && !isSelected && "hover:bg-usc-cardinal/10",
                    isAvailable ? "cursor-pointer" : "cursor-not-allowed"
                  )}
                  onClick={isAvailable ? () => onDateChange(dayDate) : undefined}
                  disabled={!isAvailable}
                >
                  <time dateTime={format(dayDate, 'yyyy-MM-dd')}>
                    {dayDate.getDate()}
                  </time>
                </button>
                {isAvailable && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-usc-cardinal" />
                )}
              </div>
            );
          }
        }}
      />
      
      {date && (
        <div className="text-center mt-4">
          <p className="text-muted-foreground">
            {isToday(date) 
              ? "Selected date: Today" 
              : `Selected date: ${format(date, 'EEEE, MMMM d, yyyy')}`}
          </p>
        </div>
      )}
    </div>
  );
};
