
import { useState } from 'react';
import { format, addDays, isSameDay, startOfWeek, isSameMonth, isToday } from 'date-fns';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateSelectorProps {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date) => void;
  availableDates?: Date[];
}

export function DateSelector({ selectedDate, onSelectDate, availableDates }: DateSelectorProps) {
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 0 }));
  
  // Generate array of 7 days starting from weekStart
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Select a Date</h2>
        <Tabs defaultValue="week" value={viewMode} onValueChange={(value) => setViewMode(value as "week" | "month")}>
          <TabsList className="grid w-[180px] grid-cols-2 bg-gray-100">
            <TabsTrigger value="week" className="data-[state=active]:bg-white">
              <CalendarIcon className="mr-2 h-4 w-4" /> Week
            </TabsTrigger>
            <TabsTrigger value="month" className="data-[state=active]:bg-white">
              <CalendarIcon className="mr-2 h-4 w-4" /> Month
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewMode === "week" ? (
        <div className="border rounded-md overflow-hidden">
          <div className="flex justify-between items-center p-2 border-b">
            <Button variant="ghost" size="icon" onClick={handlePreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="font-medium">
              {format(weekStart, 'MMMM yyyy')}
            </span>
            
            <Button variant="ghost" size="icon" onClick={handleNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-8 text-center">
            {weekDays.map((date, i) => (
              <div key={i} className="p-2">
                <div className="text-sm text-muted-foreground">
                  {format(date, 'EEE')}
                </div>
                <Button
                  variant="ghost"
                  className={cn(
                    "h-10 w-10 rounded-full p-0 font-normal",
                    isToday(date) && "bg-muted font-medium",
                    isSameDay(date, selectedDate) && "bg-usc-cardinal text-white hover:bg-usc-cardinal-dark hover:text-white",
                    !isDateAvailable(date) && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={!isDateAvailable(date)}
                  onClick={() => onSelectDate(date)}
                >
                  {format(date, 'd')}
                </Button>
                {isToday(date) && (
                  <div className="text-xs text-muted-foreground">Today</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && onSelectDate(date)}
                initialFocus
                className="p-3 pointer-events-auto"
                disabled={(date) => !isDateAvailable(date)}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
