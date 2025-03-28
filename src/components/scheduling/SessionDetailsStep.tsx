
import { useState } from 'react';
import { useScheduling } from "@/contexts/SchedulingContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { formatTimeDisplay } from "@/lib/scheduling/time-utils";
import { format } from 'date-fns';

export function SessionDetailsStep() {
  const { state, dispatch, tutor, calculatePrice } = useScheduling();
  const [notes, setNotes] = useState<string>(state.notes || '');
  
  if (!state.selectedDate || !state.selectedTimeSlot || !tutor) {
    return null;
  }
  
  const sessionDate = format(state.selectedDate, 'EEEE, MMMM d, yyyy');
  const sessionTime = `${formatTimeDisplay(state.selectedTimeSlot.start)} - ${formatTimeDisplay(state.selectedTimeSlot.end)}`;
  const sessionPrice = calculatePrice(state.selectedDuration);
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };
  
  const handleBack = () => {
    dispatch({ type: 'SET_STEP', payload: 'time' });
  };
  
  const handleContinue = () => {
    dispatch({ type: 'SET_NOTES', payload: notes });
    dispatch({ type: 'SET_STEP', payload: 'payment' });
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Session Details</h2>
      
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tutor:</span>
              <span className="font-medium">{tutor.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{sessionDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time:</span>
              <span className="font-medium">{sessionTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-medium">{state.selectedDuration} minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price:</span>
              <span className="font-medium">${sessionPrice.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-2">
        <label htmlFor="notes" className="block text-sm font-medium">
          Additional Notes (Optional)
        </label>
        <Textarea
          id="notes"
          placeholder="Add any notes or specific topics you'd like to cover..."
          value={notes}
          onChange={handleNotesChange}
          rows={4}
        />
      </div>
      
      <div className="mt-6 flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleBack}
        >
          Back
        </Button>
        <Button 
          onClick={handleContinue}
          className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
        >
          Proceed to Payment
        </Button>
      </div>
    </div>
  );
}
