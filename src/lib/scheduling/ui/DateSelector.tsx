
import { useState } from 'react';
import { format, addDays, isSameDay, startOfWeek, isSameMonth, isToday } from 'date-fns';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DateSelectorProps {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date) => void;
  availableDates?: Date[];
}

export function DateSelector({ selectedDate, onSelectDate, availableDates }: DateSelectorProps) {
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 0 }));
  
  // Generate array of 8 days starting from weekStart
  const weekDays = Array.from({ length: 8 }, (_, i) => addDays(weekStart, i));
  
  const handlePreviousWeek = () => {
    setWeekStart(addDays(weekStart, -7));
  };
  
  const handleNextWeek = () => {
    setWeekStart(addDays(weekStart, 7));
  };
  
  const isDateAvailable = (date: Date) => {
    if (!availableDates) return true;
    return availableDates.some(availableDate => isSameDay(availableDate, date));
  };
  
  return (
    <div className="space-y-6 w-full overflow-hidden">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl sm:text-2xl font-bold">Select a Date</h2>
        <Tabs defaultValue="week" value={viewMode} onValueChange={(value) => setViewMode(value as "week" | "month")}>
          <TabsList>
            <TabsTrigger value="week" className="px-3 sm:px-4">
              <CalendarIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Week</span>
            </TabsTrigger>
            <TabsTrigger value="month" className="px-3 sm:px-4">
              <CalendarIcon className="h-4 w-4 mr-2" /> 
              <span className="hidden sm:inline">Month</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <div className="grid grid-cols-8 text-center border-b min-w-[640px]">
          {weekDays.map((date, i) => (
            <div key={i} className="p-2 sm:p-4 border-r last:border-r-0">
              <div className="text-xs sm:text-sm text-gray-500 mb-1">
                {format(date, 'EEE')}
              </div>
              <Button
                variant="ghost"
                className={cn(
                  "h-10 w-10 sm:h-12 sm:w-12 rounded-full p-0 font-normal text-sm sm:text-lg",
                  isToday(date) && !selectedDate && "bg-gray-100 font-medium",
                  selectedDate && isSameDay(date, selectedDate) && "bg-usc-cardinal text-white hover:bg-usc-cardinal-dark",
                  !isDateAvailable(date) && "opacity-50 cursor-not-allowed"
                )}
                disabled={!isDateAvailable(date)}
                onClick={() => onSelectDate(date)}
              >
                {format(date, 'd')}
              </Button>
              {isToday(date) && (
                <div className="text-xs text-gray-500 mt-1">Today</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
