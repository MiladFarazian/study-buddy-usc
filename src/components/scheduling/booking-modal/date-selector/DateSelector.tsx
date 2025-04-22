
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { 
  format, 
  isToday, 
  isSameDay, 
  startOfWeek, 
  addDays, 
  startOfDay,
  addWeeks,
  subWeeks
} from "date-fns";
import { cn } from "@/lib/utils";
import { BookingSlot } from "@/lib/scheduling";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";

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

  const hasSlotsForSelectedDate = date 
    ? availableSlots.some(slot => {
        const slotDay = slot.day instanceof Date ? slot.day : new Date(slot.day);
        return isSameDay(slotDay, date) && slot.available;
      })
    : false;
  
  const calendarKey = `calendar-${viewMode}-${date ? format(date, 'yyyy-MM-dd') : 'none'}-${currentWeekStart ? format(currentWeekStart, 'yyyy-MM-dd') : 'none'}`;
  
  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-xl font-semibold">Select a Date</h3>
        <Tabs 
          defaultValue="week" 
          value={viewMode} 
          onValueChange={(value) => setViewMode(value as "week" | "month")}
          className="w-full sm:w-auto"
        >
          <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
            <TabsTrigger value="week" className="w-full sm:w-auto">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Week
            </TabsTrigger>
            <TabsTrigger value="month" className="w-full sm:w-auto">
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
            
            <span className="font-medium text-sm sm:text-base">
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
                
                return (
                  <div key={index} className="flex flex-col items-center">
                    <span className="text-[10px] sm:text-xs text-muted-foreground mb-1">
                      {getDayAbbreviation(day)}
                    </span>
                    <Button
                      variant={date && isSameDay(day, date) ? "default" : "outline"}
                      className={cn(
                        "h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full p-0 font-normal text-sm sm:text-base md:text-lg",
                        isToday(day) && !isSameDay(day, date || new Date()) && "bg-muted border border-usc-cardinal/30",
                        isSameDay(day, date || new Date()) && "bg-usc-cardinal text-white hover:bg-usc-cardinal-dark",
                        !hasSlots && "opacity-50 cursor-not-allowed",
                        hasSlots && !date && "hover:border-usc-cardinal"
                      )}
                      disabled={!hasSlots}
                      onClick={() => {
                        if (hasSlots) {
                          onDateChange(day);
                        }
                      }}
                    >
                      {format(day, 'd')}
                      {hasSlots && (
                        <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-usc-cardinal"></span>
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
                className="rounded-full text-sm"
                onClick={handleToday}
              >
                Today
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-[300px] sm:min-h-[350px] w-full flex items-center justify-center border rounded-md p-2 overflow-x-auto">
          <Calendar
            key={calendarKey}
            mode="single"
            selected={date}
            onSelect={onDateChange}
            className="w-full max-w-full"
            disabled={(day) => !hasAvailableSlots(day)}
            classNames={{
              day_today: "bg-muted",
              day_selected: "bg-usc-cardinal text-white hover:bg-usc-cardinal-dark focus:bg-usc-cardinal-dark",
              day_disabled: "text-muted-foreground opacity-50",
              months: "w-full",
              month: "w-full",
              table: "w-full",
              head_row: "flex w-full justify-between",
              row: "flex w-full justify-between mt-2",
              cell: "h-6 w-6 sm:h-8 sm:w-8 text-center p-0 relative [&:has([aria-selected])]:bg-accent focus-within:relative focus-within:z-20",
              day: "h-6 w-6 sm:h-8 sm:w-8 p-0 font-normal aria-selected:opacity-100"
            }}
          />
        </div>
      )}
      
      {date && !isLoading && (
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            {isToday(date) 
              ? "Selected date: Today" 
              : `Selected date: ${format(date, 'EEEE, MMMM d, yyyy')}`}
          </p>
        </div>
      )}
    </div>
  );
};
