
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { Clock, Loader2 } from "lucide-react";
import { BookingSlot } from '@/types/scheduling';
import { useScheduling } from '@/contexts/SchedulingContext';

interface TimeSlotsProps {
  availableSlots: BookingSlot[];
}

export const TimeSlots: React.FC<TimeSlotsProps> = ({ availableSlots }) => {
  const { state, dispatch } = useScheduling();
  const { selectedDate, selectedTimeSlot } = state;
  
  const [visibleSlots, setVisibleSlots] = useState<BookingSlot[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (selectedDate) {
      setLoading(true);
      
      // Filter slots for the selected date
      const slotsForDate = availableSlots.filter(
        slot => format(slot.day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
      );
      
      // Sort by time
      slotsForDate.sort((a, b) => a.start.localeCompare(b.start));
      
      setVisibleSlots(slotsForDate);
      setLoading(false);
    } else {
      setVisibleSlots([]);
    }
  }, [selectedDate, availableSlots]);
  
  const handleSelectSlot = (slot: BookingSlot) => {
    dispatch({ type: 'SELECT_TIME_SLOT', payload: slot });
  };
  
  if (!selectedDate) {
    return (
      <div className="mt-6 text-center p-4 border rounded-md bg-muted/30">
        <p className="text-muted-foreground">
          Please select a date to view available time slots
        </p>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="mt-6 flex justify-center items-center p-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
        <span>Loading time slots...</span>
      </div>
    );
  }
  
  if (visibleSlots.length === 0) {
    return (
      <div className="mt-6 text-center p-4 border rounded-md bg-muted/30">
        <p className="text-muted-foreground">
          No available time slots for {format(selectedDate, 'MMMM d, yyyy')}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Please select another date
        </p>
      </div>
    );
  }
  
  // Format time to 12-hour format
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  
  return (
    <div className="mt-6 space-y-3">
      <h3 className="text-lg font-medium">Available Time Slots</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {visibleSlots.map((slot, index) => {
          const isSelected = selectedTimeSlot && 
            selectedTimeSlot.day.getTime() === slot.day.getTime() && 
            selectedTimeSlot.start === slot.start;
          
          return (
            <Button
              key={`${format(slot.day, 'yyyy-MM-dd')}-${slot.start}-${index}`}
              variant={isSelected ? "default" : "outline"}
              className={isSelected ? "bg-usc-cardinal hover:bg-usc-cardinal-dark" : ""}
              onClick={() => handleSelectSlot(slot)}
            >
              <Clock className="h-4 w-4 mr-2" />
              {formatTime(slot.start)}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
