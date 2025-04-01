
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BookingSlot } from "@/lib/scheduling";
import { useScheduling } from '@/contexts/SchedulingContext';
import { TimeSelector } from "@/lib/scheduling/ui/TimeSelector";

interface DateSelectionStepProps {
  availableSlots: BookingSlot[];
  isLoading: boolean;
}

export function DateSelectionStep({ availableSlots, isLoading }: DateSelectionStepProps) {
  const { state, dispatch, continueToNextStep } = useScheduling();
  const { selectedDate, selectedTimeSlot } = state;
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Function to determine which dates have available slots
  const getDatesWithSlots = () => {
    const datesMap = new Map<string, Date>();
    
    availableSlots.forEach(slot => {
      if (slot.available) {
        const dateStr = format(slot.day, 'yyyy-MM-dd');
        if (!datesMap.has(dateStr)) {
          datesMap.set(dateStr, slot.day);
        }
      }
    });
    
    return Array.from(datesMap.values());
  };
  
  const datesWithSlots = getDatesWithSlots();
  
  // Get available time slots for the selected date
  const getTimeSlots = () => {
    if (!selectedDate) return [];
    
    const slots = availableSlots.filter(slot => {
      const slotDate = new Date(slot.day);
      return (
        slot.available && 
        slotDate.getDate() === selectedDate.getDate() &&
        slotDate.getMonth() === selectedDate.getMonth() &&
        slotDate.getFullYear() === selectedDate.getFullYear()
      );
    });
    
    // Convert booking slots to time slots for the TimeSelector component
    return slots.map(slot => ({
      time: slot.start,
      available: slot.available
    }));
  };
  
  const handleDateSelect = (date: Date | undefined) => {
    setCalendarOpen(false);
    if (date) {
      dispatch({ type: 'SELECT_DATE', payload: date });
    }
  };
  
  const handleTimeSelect = (time: string) => {
    const slot = availableSlots.find(s => {
      const sameDay = format(s.day, 'yyyy-MM-dd') === format(selectedDate!, 'yyyy-MM-dd');
      return sameDay && s.start === time;
    });
    
    if (slot) {
      dispatch({ type: 'SELECT_TIME_SLOT', payload: slot });
    }
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Select Date & Time</h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : <span>Select date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate || undefined}
                    onSelect={handleDateSelect}
                    initialFocus
                    disabled={(date) => {
                      // Only enable dates that have available slots
                      return !datesWithSlots.some(
                        d => d.toDateString() === date.toDateString()
                      );
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium">Time</label>
            {isLoading ? (
              <div className="flex items-center justify-center p-8 border rounded-md">
                <Loader2 className="h-6 w-6 animate-spin text-usc-cardinal mr-2" />
                <span>Loading available times...</span>
              </div>
            ) : selectedDate ? (
              <TimeSelector
                availableTimeSlots={getTimeSlots()}
                selectedTime={selectedTimeSlot?.start || null}
                onSelectTime={handleTimeSelect}
              />
            ) : (
              <div className="flex items-center justify-center p-8 border rounded-md bg-muted/20">
                <p className="text-muted-foreground">
                  Please select a date to view available times
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end mt-8">
          <Button 
            className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white px-8"
            onClick={continueToNextStep}
            disabled={!selectedDate || !selectedTimeSlot}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
