
import { Calendar } from "@/components/ui/calendar";
import { BookingSlot } from "@/lib/scheduling/types";
import { CalendarIcon } from "lucide-react";
import { format, isEqual, parseISO, isSameDay } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  
  // Get all available dates from the slots
  const availableDates = useMemo(() => {
    console.log("DateSelector rendering with", availableSlots.length, "available slots");
    const dateSet = new Set<string>();
    
    availableSlots.forEach(slot => {
      if (slot.available) {
        const slotDate = slot.day instanceof Date ? slot.day : new Date(slot.day);
        dateSet.add(format(slotDate, 'yyyy-MM-dd'));
      }
    });
    
    return Array.from(dateSet).map(dateStr => parseISO(dateStr));
  }, [availableSlots]);

  // Set first available date if none is selected
  useEffect(() => {
    if (!date && availableDates.length > 0 && !isLoading) {
      onDateChange(availableDates[0]);
    }
  }, [date, availableDates, onDateChange, isLoading]);

  // Function to determine if a date has available slots
  const hasAvailableSlots = (day: Date): boolean => {
    return availableDates.some(availableDate => isSameDay(availableDate, day));
  };
  
  // Function to get the first and last day of the current week
  const getCurrentWeekRange = () => {
    if (!date) return "";
    
    const today = date;
    const day = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - day);
    
    const lastDayOfWeek = new Date(today);
    lastDayOfWeek.setDate(today.getDate() + (6 - day));
    
    return `${format(firstDayOfWeek, 'MMM d')} - ${format(lastDayOfWeek, 'MMM d, yyyy')}`;
  };
  
  // Render a weekly date selector
  const renderWeekView = () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Create array of days for the current week
    const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(today);
      day.setDate(today.getDate() - currentDayOfWeek + i); // Start from Sunday
      return day;
    });
    
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <button className="p-2 rounded-md hover:bg-gray-100">
            &lt;
          </button>
          <h3 className="text-center font-medium">{getCurrentWeekRange()}</h3>
          <button className="p-2 rounded-md hover:bg-gray-100">
            &gt;
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-2 text-center">
          {dayLabels.map((dayLabel, index) => (
            <div key={dayLabel} className="text-sm text-muted-foreground">
              {dayLabel}
            </div>
          ))}
          
          {daysOfWeek.map((day, i) => {
            const isSelected = date && isSameDay(date, day);
            const hasSlots = hasAvailableSlots(day);
            const isToday = isSameDay(day, today);
            
            return (
              <button
                key={i}
                onClick={() => hasSlots && onDateChange(day)}
                className={cn(
                  "rounded-full w-10 h-10 mx-auto flex items-center justify-center text-sm relative",
                  isSelected && hasSlots ? "bg-usc-cardinal text-white" : "",
                  !isSelected && hasSlots ? "hover:bg-gray-100" : "",
                  !hasSlots ? "text-gray-300 cursor-not-allowed" : "",
                  isToday && !isSelected ? "border border-usc-cardinal" : ""
                )}
                disabled={!hasSlots}
              >
                {day.getDate()}
                {isToday && !isSelected && (
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                    <span className="text-xs bg-gray-100 rounded-md px-2 py-0.5">Today</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Select a Date</h1>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button 
          variant={viewMode === "week" ? "default" : "outline"} 
          size="sm"
          onClick={() => setViewMode("week")}
          className={viewMode === "week" ? "bg-muted text-foreground" : ""}
        >
          Week
        </Button>
        <Button 
          variant={viewMode === "month" ? "default" : "outline"} 
          size="sm"
          onClick={() => setViewMode("month")}
          className={viewMode === "month" ? "bg-muted text-foreground" : ""}
        >
          Month
        </Button>
      </div>
      
      <div className={`border rounded-lg p-4 ${className || ''}`}>
        {viewMode === "week" ? (
          renderWeekView()
        ) : (
          <Calendar
            mode="single"
            selected={date}
            onSelect={(selectedDate) => selectedDate && onDateChange(selectedDate)}
            disabled={day => !hasAvailableSlots(day)}
            initialFocus={true}
            className="mx-auto"
          />
        )}
      </div>
      
      {date && (
        <p className="text-center font-medium">
          Selected date: {format(date, 'EEEE, MMMM d, yyyy')}
        </p>
      )}
    </div>
  );
}
