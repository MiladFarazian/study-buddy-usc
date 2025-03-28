
import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useScheduling } from '@/contexts/SchedulingContext';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { formatTimeDisplay } from '@/lib/scheduling/time-utils';
import { useAuth } from '@/contexts/AuthContext';
import { createSessionBooking, createPaymentTransaction } from '@/lib/scheduling';
import { useToast } from '@/hooks/use-toast';

interface PaymentStepProps {
  onComplete: () => void;
  onRequireAuth: () => void;
}

export function PaymentStep({ onComplete, onRequireAuth }: PaymentStepProps) {
  const { state, dispatch, calculatePrice, tutor } = useScheduling();
  const { user } = useAuth();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  
  if (!state.selectedTimeSlot || !state.selectedDate || !tutor) return null;
  
  // Calculate price
  const price = calculatePrice(state.selectedDuration);
  
  // Calculate end time based on duration
  const { start: startTime } = state.selectedTimeSlot;
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = startTotalMinutes + state.selectedDuration;
  const endHour = Math.floor(endTotalMinutes / 60);
  const endMinute = endTotalMinutes % 60;
  const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  
  // Format the selected time for display
  const formattedDate = format(state.selectedDate, 'EEEE, MMMM d, yyyy');
  const formattedStartTime = formatTimeDisplay(startTime);
  const formattedEndTime = formatTimeDisplay(endTime);
  
  const handleBack = () => {
    dispatch({ type: 'SET_STEP', payload: 'details' });
  };
  
  const handleSubmitPayment = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }
    
    setProcessing(true);
    
    try {
      // Format the date and times for the session
      const sessionDate = format(state.selectedDate, 'yyyy-MM-dd');
      const fullStartTime = `${sessionDate}T${startTime}:00`;
      const fullEndTime = `${sessionDate}T${endTime}:00`;
      
      // Create the session in the database
      const session = await createSessionBooking(
        user.id,
        tutor.id,
        null, // No course selected for now
        fullStartTime,
        fullEndTime,
        null, // No location for now
        state.notes || null
      );
      
      if (!session) {
        throw new Error("Failed to create session");
      }
      
      // Create a payment transaction
      await createPaymentTransaction(
        session.id,
        user.id,
        tutor.id,
        price
      );
      
      toast({
        title: "Booking Successful",
        description: "Your session has been booked successfully!",
      });
      
      // Move to confirmation page
      dispatch({ type: 'SET_STEP', payload: 'confirmation' });
      onComplete();
      
    } catch (error) {
      console.error("Error booking session:", error);
      toast({
        title: "Booking Failed",
        description: "Failed to book your session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Payment
            </h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBack}
              disabled={processing}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
          
          <div className="space-y-4 bg-muted p-4 rounded-lg">
            <h3 className="font-medium">Session Summary</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time:</span>
                <span>{formattedStartTime} - {formattedEndTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span>{state.selectedDuration} minutes ({(state.selectedDuration / 60).toFixed(1)} hours)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tutor:</span>
                <span>{tutor.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate:</span>
                <span>${tutor.hourlyRate?.toFixed(2) || "25.00"}/hour</span>
              </div>
              
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span className="text-usc-cardinal">${price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {state.notes && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Session Notes:</h3>
              <p className="text-sm text-muted-foreground">{state.notes}</p>
            </div>
          )}
          
          <div className="pt-2 flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleBack}
              disabled={processing}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button 
              onClick={handleSubmitPayment}
              className="bg-usc-cardinal hover:bg-usc-cardinal-dark"
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay ${price.toFixed(2)}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
