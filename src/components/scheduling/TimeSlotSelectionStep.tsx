
import { useMemo } from 'react';
import { format, isSameDay } from 'date-fns';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useScheduling } from '@/contexts/SchedulingContext';
import { BookingSlot } from '@/lib/scheduling/types';
import { Clock, ArrowLeft, ArrowRight } from 'lucide-react';
import { formatTimeDisplay } from '@/lib/scheduling/time-utils';

interface TimeSlotSelectionStepProps {
  availableSlots: BookingSlot[];
  isLoading: boolean;
}

export function TimeSlotSelectionStep({ availableSlots, isLoading }: TimeSlotSelectionStepProps) {
  const { state, dispatch } = useScheduling();
  
  // Filter slots for selected date
  const availableSlotsForDate = useMemo(() => {
    if (!state.selectedDate) return [];
    
    return availableSlots
      .filter(slot => slot.available && isSameDay(slot.day, state.selectedDate))
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [availableSlots, state.selectedDate]);

  const handleTimeSlotSelect = (slot: BookingSlot) => {
    dispatch({ type: 'SELECT_TIME_SLOT', payload: slot });
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', payload: 'date' });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Select a Time Slot
              {state.selectedDate && (
                <span className="block text-sm text-muted-foreground font-normal">
                  {format(state.selectedDate, 'EEEE, MMMM d, yyyy')}
                </span>
              )}
            </h2>
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
          
          {availableSlotsForDate.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {availableSlotsForDate.map((slot, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center justify-center hover:border-usc-cardinal hover:bg-red-50 transition-colors"
                  onClick={() => handleTimeSlotSelect(slot)}
                >
                  <Clock className="h-5 w-5 mb-2 text-usc-cardinal" />
                  <span className="text-base font-medium">
                    {formatTimeDisplay(slot.start)} - {formatTimeDisplay(slot.end)}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {calculateDuration(slot.start, slot.end)} min
                  </span>
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 border rounded-lg bg-muted/30">
              <Clock className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-center">
                No available time slots for this date. Please select another date.
              </p>
              <Button 
                variant="outline" 
                onClick={handleBack} 
                className="mt-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Choose Another Date
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to calculate duration in minutes
function calculateDuration(start: string, end: string): number {
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  return endMinutes - startMinutes;
}
