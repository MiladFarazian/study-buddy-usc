
import React from 'react';
import { BookingSlot } from '@/lib/scheduling/types';
import { Tutor } from '@/types/tutor';
import { formatDate, formatTime } from '@/lib/scheduling/time-utils';
import { useSessionCost } from './hooks/useSessionCost';
import { StripePaymentForm } from './StripePaymentForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BookingPaymentFormProps {
  tutor: Tutor;
  selectedSlot: BookingSlot | null;
  sessionId: string;
  amount: number;
  clientSecret: string | null;
  onPaymentComplete: () => void;
  onBack: () => void;
  processing: boolean;
  retryPaymentSetup: () => void;
  error?: string | null;
  isTwoStagePayment?: boolean;
}

export function BookingPaymentForm({
  tutor,
  selectedSlot,
  sessionId,
  amount,
  clientSecret,
  onPaymentComplete,
  onBack,
  processing,
  retryPaymentSetup,
  error,
  isTwoStagePayment = false
}: BookingPaymentFormProps) {
  // Get session cost using the hook (this would provide more accurate cost calculation)
  const { sessionCost } = useSessionCost(selectedSlot, tutor);
  
  // Use the provided amount or fall back to calculated sessionCost
  const displayAmount = amount > 0 ? amount : sessionCost;
  
  if (!selectedSlot) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>No time slot selected. Please go back and select a time slot.</AlertDescription>
        </Alert>
        <Button onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    );
  }
  
  const formattedDate = selectedSlot.day instanceof Date 
    ? formatDate(selectedSlot.day)
    : formatDate(new Date(selectedSlot.day as string));
    
  const formattedStartTime = formatTime(selectedSlot.start);
  const formattedEndTime = formatTime(selectedSlot.end);
  
  return (
    <div className="p-4">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Session Details</h3>
        <div className="bg-muted p-4 rounded-md">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-muted-foreground">Date:</div>
            <div>{formattedDate}</div>
            
            <div className="text-muted-foreground">Time:</div>
            <div>{formattedStartTime} - {formattedEndTime}</div>
            
            <div className="text-muted-foreground">Tutor:</div>
            <div>{tutor.firstName} {tutor.lastName}</div>
            
            <div className="text-muted-foreground">Total:</div>
            <div className="font-medium">${displayAmount.toFixed(2)}</div>
          </div>
        </div>
      </div>
      
      {isTwoStagePayment && (
        <Alert className="mb-4 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Payment Information</AlertTitle>
          <AlertDescription className="text-blue-700">
            Your tutor is in the process of setting up their payment account. Your payment will be processed now and transferred to them once their account setup is complete.
          </AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      <StripePaymentForm
        clientSecret={clientSecret}
        amount={displayAmount}
        onSuccess={onPaymentComplete}
        onCancel={onBack}
        processing={processing}
        retryPaymentSetup={retryPaymentSetup}
        isTwoStagePayment={isTwoStagePayment}
      />
    </div>
  );
}
