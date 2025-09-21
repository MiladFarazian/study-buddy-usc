import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { format, addDays, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import { WeeklyAvailability } from "@/lib/scheduling/types/availability";
import { BookedSession } from "@/lib/scheduling/types/booking";
import { isCellAvailable, getAvailableHours } from "@/lib/scheduling/availability-utils";
import { cn } from "@/lib/utils";

interface BookingAvailabilityCalendarProps {
  availability: WeeklyAvailability;
  bookedSessions: BookedSession[];
  selectedDate: Date | undefined;
  selectedTime: string | undefined;
  onSelectDateTime: (date: Date, hour: number) => void;
  onContinue: () => void;
  className?: string;
}

export function BookingAvailabilityCalendar({
  availability,
  bookedSessions,
  selectedDate,
  selectedTime,
  onSelectDateTime,
  onContinue,
  className
}: BookingAvailabilityCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(selectedDate || new Date(), { weekStartsOn: 0 })
  );
  
  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 10 PM
  
  // Generate the current week's dates
  const weekDates = weekDays.map((_, index) => addDays(currentWeekStart, index));
  
  const handlePrevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const handleNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  
  const formatHour = (hour: number): string => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };
  
  const isTimeSlotSelected = useCallback((date: Date, hour: number): boolean => {
    if (!selectedDate || !selectedTime) return false;
    
    const selectedHour = parseInt(selectedTime.split(':')[0]);
    return format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') && hour === selectedHour;
  }, [selectedDate, selectedTime]);
  
  const isTimeSlotAvailable = useCallback((date: Date, hour: number): boolean => {
    const weekDayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = weekDayNames[date.getDay()];
    
    // Check if it's available using the working calendar logic
    if (!isCellAvailable(availability, dayOfWeek, hour)) {
      return false;
    }
    
    // Check for booking conflicts
    const availableHours = getAvailableHours(availability, date, bookedSessions);
    return availableHours.includes(hour);
  }, [availability, bookedSessions]);
  
  const handleTimeSlotClick = (date: Date, hour: number) => {
    if (isTimeSlotAvailable(date, hour)) {
      onSelectDateTime(date, hour);
    }
  };
  
  const hasValidSelection = selectedDate && selectedTime;
  
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Select Date & Time
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevWeek}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextWeek}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Day headers */}
            <div className="grid grid-cols-8 gap-1 mb-2">
              <div className="text-sm font-medium text-muted-foreground p-2">Time</div>
              {weekDates.map((date, index) => (
                <div key={index} className="text-center p-2">
                  <div className="text-sm font-medium">{weekDays[index].slice(0, 3)}</div>
                  <div className="text-xs text-muted-foreground">{format(date, 'M/d')}</div>
                </div>
              ))}
            </div>
            
            {/* Time slots */}
            {hours.map(hour => (
              <div key={hour} className="grid grid-cols-8 gap-1 mb-1">
                <div className="text-sm text-muted-foreground p-2 text-right">
                  {formatHour(hour)}
                </div>
                {weekDates.map((date, dayIndex) => {
                  const isAvailable = isTimeSlotAvailable(date, hour);
                  const isSelected = isTimeSlotSelected(date, hour);
                  const isPast = date < new Date() || (date.toDateString() === new Date().toDateString() && hour <= new Date().getHours() + 3);
                  
                  return (
                    <button
                      key={`${dayIndex}-${hour}`}
                      onClick={() => handleTimeSlotClick(date, hour)}
                      disabled={!isAvailable || isPast}
                      className={cn(
                        "h-8 text-xs rounded border transition-all duration-200",
                        isSelected && "bg-usc-cardinal text-white border-usc-cardinal ring-2 ring-usc-cardinal/20",
                        isAvailable && !isSelected && !isPast && "bg-green-50 border-green-200 hover:bg-green-100 text-green-700",
                        (!isAvailable || isPast) && "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed",
                        !isSelected && isAvailable && !isPast && "hover:scale-105"
                      )}
                    >
                      {isAvailable && !isPast && !isSelected && "Available"}
                      {isSelected && "Selected"}
                      {isPast && "Past"}
                      {!isAvailable && !isPast && "Busy"}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {hasValidSelection ? (
                <span>
                  Selected: {format(selectedDate!, 'EEEE, MMMM d')} at {formatHour(parseInt(selectedTime!.split(':')[0]))}
                </span>
              ) : (
                <span>Click on an available time slot to select</span>
              )}
            </div>
            <Button 
              onClick={onContinue}
              disabled={!hasValidSelection}
              className="bg-usc-cardinal hover:bg-usc-cardinal-dark"
            >
              Continue to Duration
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}