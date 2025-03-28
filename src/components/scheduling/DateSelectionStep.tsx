
import { useState } from 'react';
import { format, isSameDay, isToday, parseISO } from 'date-fns';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useScheduling } from '@/contexts/SchedulingContext';
import { BookingSlot } from '@/lib/scheduling/types';
import { Calendar as CalendarIcon, ArrowRight } from 'lucide-react';

interface DateSelectionStepProps {
  availableSlots: BookingSlot[];
  isLoading: boolean;
}

export function DateSelectionStep({ availableSlots, isLoading }: DateSelectionStepProps) {
  const { state, dispatch } = useScheduling();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(state.selectedDate || undefined);

  // Get all unique dates that have available slots
  const availableDates = Array.from(
    new Set(
      availableSlots
        .filter(slot => slot.available)
        .map(slot => format(slot.day, 'yyyy-MM-dd'))
    )
  ).map(dateStr => parseISO(dateStr));

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setSelectedDate(date);
  };

  const handleContinue = () => {
    if (selectedDate) {
      dispatch({ type: 'SELECT_DATE', payload: selectedDate });
    }
  };

  // Function to check if a date has available slots
  const hasAvailableSlots = (date: Date) => {
    return availableDates.some(availableDate => isSameDay(availableDate, date));
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Select a Date</h2>
            {selectedDate && (
              <Button 
                onClick={handleContinue}
                className="bg-usc-cardinal hover:bg-usc-cardinal-dark"
              >
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="rounded-lg border p-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => {
                // Disable dates with no available slots
                return !hasAvailableSlots(date);
              }}
              className="rounded-md mx-auto"
              initialFocus
            />
          </div>
          
          {selectedDate && (
            <div className="bg-muted p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2 text-usc-cardinal" />
                <span>
                  {isToday(selectedDate) 
                    ? 'Today' 
                    : format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
              
              <Button
                onClick={handleContinue}
                size="sm"
                className="bg-usc-cardinal hover:bg-usc-cardinal-dark"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
