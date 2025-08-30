import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, ExternalLink } from 'lucide-react';
import { Tutor } from '@/types/tutor';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface PaymentStepProps {
  onBack?: () => void;
  onContinue?: (sessionId: string, paymentSuccess: boolean) => void;
  calculatedCost?: number;
  tutor: Tutor;
  selectedSlot?: {
    startTime: Date;
    endTime: Date;
  };
  studentName?: string;
}

export function PaymentStep({ 
  onBack, 
  onContinue, 
  calculatedCost, 
  tutor, 
  selectedSlot,
  studentName 
}: PaymentStepProps) {
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const handlePaymentClick = async () => {
    setProcessing(true);
    setMessage('Creating checkout session...');

    try {
      const sessionId = `session_${Date.now()}_${tutor.id}`;
      const amount = calculatedCost ? Math.round(calculatedCost * 100) : 3300; // Convert to cents
      
      // Format date and time for display
      const sessionDate = selectedSlot ? format(selectedSlot.startTime, 'MMMM d, yyyy') : 'TBD';
      const sessionTime = selectedSlot ? format(selectedSlot.startTime, 'h:mm a') : 'TBD';

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          sessionId,
          amount,
          tutorName: tutor.name,
          studentName: studentName || 'Student',
          sessionDate,
          sessionTime,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.open(data.url, '_blank');
        setMessage('Redirecting to Stripe checkout...');
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (err: any) {
      console.error('Error creating checkout session:', err);
      setMessage(err.message || 'Failed to create checkout session');
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <CreditCard className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold">Complete Payment</h3>
        </div>
        <p className="text-muted-foreground mb-4">
          You'll be redirected to Stripe's secure checkout page
        </p>
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <div className="text-2xl font-bold text-primary mb-2">
            ${(calculatedCost || 33).toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground">
            Tutoring session with {tutor.name}
          </div>
          {selectedSlot && (
            <div className="text-sm text-muted-foreground mt-1">
              {format(selectedSlot.startTime, 'MMMM d, yyyy')} at {format(selectedSlot.startTime, 'h:mm a')}
            </div>
          )}
        </div>
      </div>

      <Button 
        onClick={handlePaymentClick}
        disabled={processing}
        className="w-full"
        size="lg"
      >
        {processing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Creating checkout...
          </>
        ) : (
          <>
            <ExternalLink className="h-4 w-4 mr-2" />
            Pay ${(calculatedCost || 33).toFixed(2)} with Stripe
          </>
        )}
      </Button>

      {message && (
        <div className={`text-sm text-center p-3 rounded-lg ${
          message.includes('Redirecting') ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
        }`}>
          {message}
        </div>
      )}
      
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack} disabled={processing}>
          Back
        </Button>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        <p>Your payment is processed securely by Stripe.</p>
        <p>You'll receive an email receipt after successful payment.</p>
      </div>
    </div>
  );
}