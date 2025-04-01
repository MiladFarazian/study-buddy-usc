
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Select a Date</h2>
        <Tabs defaultValue="week" value={viewMode} onValueChange={(value) => setViewMode(value as "week" | "month")}>
          <TabsList>
            <TabsTrigger value="week" className="px-4">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Week
            </TabsTrigger>
            <TabsTrigger value="month" className="px-4">
              <CalendarIcon className="h-4 w-4 mr-2" /> 
              Month
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="border rounded-md overflow-hidden">
        <div className="grid grid-cols-8 text-center border-b">
          {weekDays.map((date, i) => (
            <div key={i} className="p-4 border-r last:border-r-0">
              <div className="text-sm text-gray-500 mb-1">
                {format(date, 'EEE')}
              </div>
              <Button
                variant="ghost"
                className={cn(
                  "h-12 w-12 rounded-full p-0 font-normal text-lg",
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
