
import { useState } from "react";
import { useScheduling, BookingStep } from "@/contexts/SchedulingContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatTimeDisplay } from "@/lib/scheduling/time-utils";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CreditCard } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface PaymentStepProps {
  onComplete: () => void;
  onRequireAuth: () => void;
}

export function PaymentStep({ onComplete, onRequireAuth }: PaymentStepProps) {
  const { state, dispatch, tutor, calculatePrice } = useScheduling();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [notes, setNotes] = useState(state.notes || "");
  
  if (!state.selectedDate || !state.selectedTimeSlot || !tutor) {
    return null;
  }
  
  if (!user) {
    // If user is not authenticated, show auth required
    onRequireAuth();
    return null;
  }
  
  const sessionDate = format(state.selectedDate, 'MMMM d, yyyy');
  const sessionTime = formatTimeDisplay(state.selectedTimeSlot.start);
  const sessionPrice = calculatePrice(state.selectedDuration);
  
  const handleBack = () => {
    dispatch({ type: 'SET_STEP', payload: BookingStep.SELECT_DURATION });
  };
  
  const handleSubmit = async () => {
    // Save notes to state
    dispatch({ type: 'SET_NOTES', payload: notes });
    
    setProcessing(true);
    
    // Simulate payment processing with a delay
    setTimeout(() => {
      setProcessing(false);
      onComplete();
    }, 1500);
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Complete Your Booking</h2>
      
      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="text-base font-medium mb-2">Selected Time:</h3>
        <p className="text-xl font-bold">{sessionDate} at {sessionTime}</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="session-duration" className="block text-sm font-medium mb-1">
            Session Duration
          </label>
          <div className="rounded-md border border-gray-300 px-3 py-2 flex justify-between items-center">
            <span>{state.selectedDuration} minutes (${sessionPrice.toFixed(0)})</span>
            <span className="text-gray-400">▼</span>
          </div>
        </div>
        
        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-1">
            Notes (Optional)
          </label>
          <Textarea
            id="notes"
            placeholder="Any specific topics you'd like to cover?"
            className="min-h-[100px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
      
      <Card className="border-t">
        <CardContent className="pt-4">
          <div className="flex justify-between py-2">
            <span className="font-medium">Session duration</span>
            <span>{state.selectedDuration} minutes</span>
          </div>
          <div className="flex justify-between py-2 border-t font-bold">
            <span>Total</span>
            <span>${sessionPrice.toFixed(0)}</span>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between mt-4">
        <Button 
          variant="outline" 
          onClick={handleBack}
          disabled={processing}
        >
          Back
        </Button>
        
        <Button 
          onClick={handleSubmit}
          disabled={processing}
          className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Confirm Booking
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
