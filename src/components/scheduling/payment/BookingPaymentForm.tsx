
import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StripePaymentForm } from './StripePaymentForm';
import { BookingSlot } from '@/lib/scheduling/types';
import { Tutor } from '@/types/tutor';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarDays, Clock, DollarSign } from 'lucide-react';

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
  retryPaymentSetup
}: BookingPaymentFormProps) {
  const { user } = useAuth();
  
  if (!selectedSlot || !user) {
    return (
      <div className="text-center py-6">
        <p>Invalid session details. Please go back and try again.</p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }
  
  const slotDay = selectedSlot.day instanceof Date ? selectedSlot.day : new Date(selectedSlot.day);
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium text-lg">Session Details</h3>
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-start">
              <CalendarDays className="h-5 w-5 mt-0.5 mr-3 text-muted-foreground" />
              <div>
                <p className="font-medium">Date</p>
                <p className="text-muted-foreground">
                  {format(slotDay, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Clock className="h-5 w-5 mt-0.5 mr-3 text-muted-foreground" />
              <div>
                <p className="font-medium">Time</p>
                <p className="text-muted-foreground">
                  {format(new Date(`2000-01-01T${selectedSlot.start}`), 'h:mm a')} - 
                  {format(new Date(`2000-01-01T${selectedSlot.end}`), 'h:mm a')}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <DollarSign className="h-5 w-5 mt-0.5 mr-3 text-muted-foreground" />
              <div>
                <p className="font-medium">Price</p>
                <p className="text-muted-foreground">
                  ${amount.toFixed(2)} (${tutor.hourlyRate?.toFixed(2) || "25.00"}/hr)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <StripePaymentForm 
        clientSecret={clientSecret || ""}
        amount={amount}
        onSuccess={onPaymentComplete}
        onCancel={onBack}
        processing={processing}
      />
      
      <div className="text-xs text-center text-muted-foreground mt-6">
        Your card information is processed securely via Stripe and never stored on our servers.
      </div>
    </div>
  );
}
