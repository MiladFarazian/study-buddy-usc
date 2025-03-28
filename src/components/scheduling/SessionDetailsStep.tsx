
import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useScheduling } from '@/contexts/SchedulingContext';
import { ArrowLeft, ArrowRight, CreditCard } from 'lucide-react';
import { formatTimeDisplay } from '@/lib/scheduling/time-utils';

export function SessionDetailsStep() {
  const { state, dispatch, calculatePrice, tutor } = useScheduling();
  const [sessionDuration, setSessionDuration] = useState(state.selectedDuration);
  
  if (!state.selectedTimeSlot || !state.selectedDate) return null;
  
  // Calculate max duration based on the selected time slot
  const slotStart = state.selectedTimeSlot.start;
  const slotEnd = state.selectedTimeSlot.end;
  
  const [startHour, startMinute] = slotStart.split(':').map(Number);
  const [endHour, endMinute] = slotEnd.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  const maxDuration = endMinutes - startMinutes;
  const hourlyRate = tutor?.hourlyRate || 25;
  
  // Format the selected time for display
  const formattedDate = format(state.selectedDate, 'EEEE, MMMM d, yyyy');
  const formattedStartTime = formatTimeDisplay(slotStart);
  
  // Calculate the end time based on duration
  const calculatedEndMinutes = startMinutes + sessionDuration;
  const calculatedEndHour = Math.floor(calculatedEndMinutes / 60);
  const calculatedEndMinute = calculatedEndMinutes % 60;
  const calculatedEndTime = formatTimeDisplay(
    `${calculatedEndHour.toString().padStart(2, '0')}:${calculatedEndMinute.toString().padStart(2, '0')}`
  );
  
  // Calculate price
  const price = calculatePrice(sessionDuration);
  
  const handleDurationChange = (values: number[]) => {
    // Ensure duration is at least 15 minutes and in 15-minute increments
    const newDuration = Math.max(15, Math.floor(values[0] / 15) * 15);
    setSessionDuration(newDuration);
    dispatch({ type: 'SET_DURATION', payload: newDuration });
  };
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({ type: 'SET_NOTES', payload: e.target.value });
  };
  
  const handleBack = () => {
    dispatch({ type: 'SET_STEP', payload: 'time' });
  };
  
  const handleContinue = () => {
    dispatch({ type: 'SET_STEP', payload: 'payment' });
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Session Details
            </h2>
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
          
          <div className="bg-muted p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Date</h3>
                <p className="text-base font-medium">{formattedDate}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Time</h3>
                <p className="text-base font-medium">
                  {formattedStartTime} - {calculatedEndTime}
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="duration">Session Duration</Label>
              <div className="text-base font-medium text-usc-cardinal">
                ${price.toFixed(2)}
              </div>
            </div>
            
            <Slider
              id="duration"
              min={15}
              max={maxDuration}
              step={15}
              value={[sessionDuration]}
              onValueChange={handleDurationChange}
            />
            
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>15 min</span>
              <span>{sessionDuration} minutes ({(sessionDuration / 60).toFixed(1)} hours)</span>
              <span>{(maxDuration / 60).toFixed(1)} hours</span>
            </div>
            
            <div className="text-sm text-muted-foreground text-right">
              Rate: ${hourlyRate.toFixed(2)}/hour
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Session Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="What would you like to cover in this session?"
              value={state.notes}
              onChange={handleNotesChange}
              className="resize-none h-32"
            />
          </div>
          
          <div className="pt-2 flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button 
              onClick={handleContinue}
              className="bg-usc-cardinal hover:bg-usc-cardinal-dark"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Proceed to Payment
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
