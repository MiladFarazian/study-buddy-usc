
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, isToday, isSameDay, startOfWeek, addDays, isAfter, isBefore, startOfDay, getDay, subWeeks, addWeeks } from "date-fns";
import { cn } from "@/lib/utils";
import { BookingSlot } from "@/lib/scheduling";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar"; // Added missing Calendar import

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
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    return startOfWeek(date || new Date(), { weekStartsOn: 0 });
  });
  
  const today = startOfDay(new Date());
  
  const weekDays = Array.from({ length: 7 }, (_, i) => 
    addDays(currentWeekStart, i)
  );

  // This function correctly determines if a day has available slots
  const hasAvailableSlots = (day: Date) => {
    return availableSlots.some(slot => {
      const slotDay = slot.day instanceof Date ? slot.day : new Date(slot.day);
      return isSameDay(slotDay, day) && slot.available;
    });
  };
  
  const handlePrevWeek = () => {
    setCurrentWeekStart(prevWeek => subWeeks(prevWeek, 1));
  };
  
  const handleNextWeek = () => {
    setCurrentWeekStart(prevWeek => addWeeks(prevWeek, 1));
  };
  
  const handleToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
  };

  const getDayAbbreviation = (date: Date) => {
    return format(date, 'EEE');
  };
  
  // Generate a key that changes when date changes to force Calendar re-render
  const calendarKey = `calendar-${viewMode}-${date ? format(date, 'yyyy-MM-dd') : 'none'}-${currentWeekStart ? format(currentWeekStart, 'yyyy-MM-dd') : 'none'}`;
  
  return (
    <div className="space-y-4 w-full">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Select a Date</h3>
        <Tabs 
          defaultValue="week" 
          value={viewMode} 
          onValueChange={(value) => setViewMode(value as "week" | "month")}
          className="hidden sm:block"
        >
          <TabsList>
            <TabsTrigger value="week">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Week
            </TabsTrigger>
            <TabsTrigger value="month">
              <CalendarIcon className="h-4 w-4 mr-2" /> 
              Month
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {isLoading ? (
        <div className="min-h-[200px] w-full flex justify-center items-center border rounded-md">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-usc-cardinal border-t-transparent" />
          <span className="ml-2">Loading availability...</span>
        </div>
      ) : viewMode === "week" ? (
        <div className="border rounded-md overflow-hidden">
          <div className="flex justify-between items-center p-3 border-b bg-muted/30">
            <Button variant="outline" size="icon" onClick={handlePrevWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="font-medium">
              {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
            </span>
            
            <Button variant="outline" size="icon" onClick={handleNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-3">
            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
              {weekDays.map((day, index) => {
                const hasSlots = hasAvailableSlots(day);
                const isPastDay = isBefore(day, today);
                const isDisabled = isPastDay || !hasSlots;
                
                return (
                  <div key={index} className="flex flex-col items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground mb-1">
                      {getDayAbbreviation(day)}
                    </span>
                    <Button
                      variant={date && isSameDay(day, date) ? "default" : "outline"}
                      className={cn(
                        "h-10 w-10 sm:h-12 sm:w-12 rounded-full p-0 font-normal text-lg",
                        isToday(day) && !isSameDay(day, date || new Date()) && "bg-muted border border-usc-cardinal/30",
                        isSameDay(day, date || new Date()) && "bg-usc-cardinal text-white hover:bg-usc-cardinal-dark",
                        isDisabled && "opacity-50 cursor-not-allowed",
                        hasSlots && !isPastDay && !date && "hover:border-usc-cardinal"
                      )}
                      disabled={isDisabled}
                      onClick={() => {
                        if (!isDisabled) {
                          onDateChange(day);
                        }
                      }}
                    >
                      {format(day, 'd')}
                      {hasSlots && !isPastDay && (
                        <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-usc-cardinal"></span>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 flex justify-center">
              <Button 
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={handleToday}
              >
                Today
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-[350px] w-full flex items-center justify-center border rounded-md p-2">
          <Calendar
            key={calendarKey}  // Add key to force re-render when date changes
            mode="single"
            selected={date}
            onSelect={onDateChange}
            className="w-full"
            disabled={(day) => {
              // Only disable past dates and days without available slots
              return isBefore(day, today) || !hasAvailableSlots(day);
            }}
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
