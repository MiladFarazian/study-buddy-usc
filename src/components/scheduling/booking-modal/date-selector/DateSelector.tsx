
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { format, isToday, isSameDay, startOfMonth, addMonths, subMonths, isAfter, isBefore, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { BookingSlot } from "@/lib/scheduling";
import type { DayContentProps } from "react-day-picker";

interface DateSelectorProps {
  date: Date | undefined;
  onDateChange: (date: Date) => void;
  availableSlots: BookingSlot[];
  isLoading?: boolean;
}

export const DateSelector = ({ 
  date, 
  onDateChange, 
  availableSlots,
  isLoading = false
}: DateSelectorProps) => {
  const [month, setMonth] = useState<Date>(date || new Date());
  const today = startOfDay(new Date());
  
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
    <div className="space-y-4 w-full">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Select a Date</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth} disabled={isLoading}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth} disabled={isLoading}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="min-h-[350px] w-full flex justify-center items-center border rounded-md">
          <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal mr-2" />
          <span>Loading availability...</span>
        </div>
      ) : (
        <div className="min-h-[350px] w-full flex items-center justify-center border rounded-md p-2">
          <Calendar
            mode="single"
            selected={date}
            onSelect={onDateChange}
            month={month}
            onMonthChange={setMonth}
            className="w-full"
            disabled={(day) => isBefore(day, today)} // Disable dates before today
            classNames={{
              day_today: "bg-muted",
              day_selected: "bg-usc-cardinal text-white hover:bg-usc-cardinal-dark focus:bg-usc-cardinal-dark",
              day_disabled: "text-muted-foreground opacity-50",
              months: "w-full",
              month: "w-full",
              table: "w-full",
              head_row: "flex w-full justify-between",
              row: "flex w-full justify-between mt-2",
              cell: "h-8 w-8 text-center p-0 relative [&:has([aria-selected])]:bg-accent focus-within:relative focus-within:z-20"
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
                // Check if this date is in the past
                const isPast = isBefore(dayDate, today);
                
                return (
                  <div
                    className={cn(
                      "relative p-0",
                      (!isAvailable || isPast) && "opacity-50"
                    )}
                  >
                    <button
                      type="button"
                      className={cn(
                        "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
                        isAvailable && !isPast && !isSelected && "hover:bg-usc-cardinal/10",
                        (isAvailable && !isPast) ? "cursor-pointer" : "cursor-not-allowed"
                      )}
                      onClick={(isAvailable && !isPast) ? () => onDateChange(dayDate) : undefined}
                      disabled={!isAvailable || isPast}
                    >
                      <time dateTime={format(dayDate, 'yyyy-MM-dd')}>
                        {dayDate.getDate()}
                      </time>
                    </button>
                    {isAvailable && !isPast && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-usc-cardinal" />
                    )}
                  </div>
                );
              }
            }}
          />
        </div>
      )}
      
      {date && !isLoading && (
        <div className="text-center mt-4">
          <p className="text-muted-foreground text-sm">
            {isToday(date) 
              ? "Selected date: Today" 
              : `Selected date: ${format(date, 'EEEE, MMMM d, yyyy')}`}
          </p>
        </div>
      )}
    </div>
  );
};
