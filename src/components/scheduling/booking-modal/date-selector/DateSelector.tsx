
import { Calendar } from "@/components/ui/calendar";
import { BookingSlot } from "@/lib/scheduling/types";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, isEqual, parseISO, isSameDay, addWeeks, subWeeks, startOfWeek, endOfWeek } from "date-fns";
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
  
  // State to track the current view date range
  const [currentViewDate, setCurrentViewDate] = useState<Date>(new Date());
  
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

  // Update current view date when selected date changes
  useEffect(() => {
    if (date) {
      setCurrentViewDate(date);
    }
  }, [date]);

  // Function to determine if a date has available slots
  const hasAvailableSlots = (day: Date): boolean => {
    // Prevent booking sessions in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    if (day < today) {
      return false;
    }
    
    return availableDates.some(availableDate => isSameDay(availableDate, day));
  };
  
  // Function to get the current week range as a formatted string
  const getCurrentWeekRange = () => {
    const weekStart = startOfWeek(currentViewDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentViewDate, { weekStartsOn: 0 });
    
    return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
  };
  
  // Handle previous week navigation
  const handlePrevWeek = () => {
    setCurrentViewDate(prevDate => subWeeks(prevDate, 1));
  };
  
  // Handle next week navigation
  const handleNextWeek = () => {
    setCurrentViewDate(prevDate => addWeeks(prevDate, 1));
  };
  
  // Render a weekly date selector
  const renderWeekView = () => {
    // Create array of days for the current week
    const weekStart = startOfWeek(currentViewDate, { weekStartsOn: 0 });
    const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      return day;
    });
    
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="icon" onClick={handlePrevWeek} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-center font-medium">{getCurrentWeekRange()}</h3>
          <Button variant="ghost" size="icon" onClick={handleNextWeek} className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
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
            disabled={day => {
              // Prevent selection of past dates
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              if (day < today) {
                return true;
              }
              
              return !hasAvailableSlots(day);
            }}
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
