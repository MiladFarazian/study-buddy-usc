
import { useState } from "react";
import { useScheduling } from "@/contexts/SchedulingContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatTimeDisplay } from "@/lib/scheduling/time-utils";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface PaymentStepProps {
  onComplete: () => void;
  onRequireAuth: () => void;
}

export function PaymentStep({ onComplete, onRequireAuth }: PaymentStepProps) {
  const { state, dispatch, tutor, calculatePrice } = useScheduling();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  
  if (!state.selectedDate || !state.selectedTimeSlot || !tutor) {
    return null;
  }
  
  if (!user) {
    // If user is not authenticated, show auth required
    onRequireAuth();
    return null;
  }
  
  const sessionDate = format(state.selectedDate, 'EEEE, MMMM d, yyyy');
  const sessionTime = `${formatTimeDisplay(state.selectedTimeSlot.start)} - ${formatTimeDisplay(state.selectedTimeSlot.end)}`;
  const sessionPrice = calculatePrice(state.selectedDuration);
  
  const handleBack = () => {
    dispatch({ type: 'SET_STEP', payload: 'details' });
  };
  
  const handlePayment = async () => {
    setProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      dispatch({ type: 'SET_STEP', payload: 'confirmation' });
    }, 1500);
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Complete Payment</h2>
      
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
            <div className="flex justify-between font-bold mt-2 pt-2 border-t">
              <span>Total:</span>
              <span>${sessionPrice.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="p-4 border rounded-md bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Pay with Credit Card</h3>
          <div className="flex space-x-2">
            <div className="h-6 w-10 bg-gray-200 rounded"></div>
            <div className="h-6 w-10 bg-gray-200 rounded"></div>
            <div className="h-6 w-10 bg-gray-200 rounded"></div>
          </div>
        </div>
        
        {/* Simulated payment form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Card number</label>
            <div className="h-10 bg-white border rounded-md"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Expiration date</label>
              <div className="h-10 bg-white border rounded-md"></div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">CVC</label>
              <div className="h-10 bg-white border rounded-md"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleBack}
          disabled={processing}
        >
          Back
        </Button>
        <Button 
          onClick={handlePayment}
          disabled={processing}
          className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay $${sessionPrice.toFixed(2)}`
          )}
        </Button>
      </div>
    </div>
  );
}
