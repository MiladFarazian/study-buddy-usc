import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { useScheduling } from '@/contexts/SchedulingContext';
import { useAuthState } from '@/hooks/useAuthState';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

type CreatePIResponse = {
  id: string;
  clientSecret?: string;
  client_secret?: string;
  amount: number;
  payment_transaction_id?: string;
  error?: string;
  [k: string]: any;
};

interface PaymentStepProps {
  onBack: () => void;
  onContinue: (sessionId: string, paymentSuccess: boolean) => void;
  calculatedCost?: number;
}

// Payment form component that uses Stripe Elements
function PaymentForm({ onSuccess, sessionId, calculatedCost }: { onSuccess: () => void; sessionId: string; calculatedCost: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    
    setIsSubmitting(true);
    setError(null);
    
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required'
    });
    
    setIsSubmitting(false);
    
    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed');
      return;
    }
    
    if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'requires_capture') {
      toast.success('Payment successful!');
      onSuccess();
    } else {
      setError(`Unexpected status: ${paymentIntent?.status ?? 'unknown'}`);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}
      
      <div id="payment-element-container" className="p-4 border rounded-lg" style={{ minHeight: 120 }}>
        <PaymentElement 
          id="payment-element"
          onChange={(e) => setIsComplete(e.complete)}
          options={{
            layout: 'tabs'
          }}
        />
      </div>
      
      <Button 
        onClick={handlePay}
        disabled={isSubmitting || !stripe || !elements || !isComplete}
        className="w-full bg-usc-cardinal hover:bg-usc-cardinal-dark"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Processing...
          </>
        ) : (
          `Pay $${calculatedCost.toFixed(2)}`
        )}
      </Button>
    </div>
  );
}

export function PaymentStep({ onBack, onContinue, calculatedCost = 0 }: PaymentStepProps) {
  const { state, tutor } = useScheduling();
  const { user } = useAuthState();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);

  // Memoize Stripe promise based on publishable key
  const stripePromise = useMemo(() => {
    if (!publishableKey) return null;
    if (process.env.NODE_ENV !== 'production') {
      console.log('pk last6:', publishableKey?.slice(-6), 'cs head6:', clientSecret?.slice(0,6));
    }
    return loadStripe(publishableKey);
  }, [publishableKey]);

  // Memoize Elements options based on client secret
  const elementsOptions = useMemo(() => {
    if (!clientSecret) return null;
    return {
      clientSecret,
      appearance: {
        theme: 'stripe' as const,
        variables: {
          colorPrimary: '#990000',
          colorBackground: '#ffffff',
          colorText: '#1a1a1a',
          colorDanger: '#ff5555',
          fontFamily: 'system-ui, sans-serif',
          borderRadius: '8px',
        },
      },
    };
  }, [clientSecret]);

  // Load publishable key on mount
  useEffect(() => {
    const loadStripeConfig = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-stripe-config');
        if (error) throw error;
        setPublishableKey(data.publishableKey);
      } catch (error) {
        console.error('Failed to load Stripe config:', error);
        setPaymentError('Failed to initialize payment system');
      }
    };
    loadStripeConfig();
  }, []);

  // Memoize payment setup dependencies to prevent unnecessary calls
  const paymentDeps = useMemo(() => ({
    userId: user?.id,
    tutorId: tutor?.id,
    selectedDate: state.selectedDate,
    selectedTimeSlot: state.selectedTimeSlot,
    calculatedCost
  }), [user?.id, tutor?.id, state.selectedDate, state.selectedTimeSlot, calculatedCost]);

  // Create session and payment intent when component mounts or dependencies change
  useEffect(() => {
    if (!paymentDeps.userId || !paymentDeps.tutorId || !paymentDeps.selectedDate || !paymentDeps.selectedTimeSlot) return;
    // Only create if we don't already have a clientSecret to prevent duplicate calls
    if (clientSecret) return;

    createSessionAndPaymentIntent();
  }, [paymentDeps, clientSecret]);

  const createSessionAndPaymentIntent = async () => {
    if (!user || !tutor || !state.selectedDate || !state.selectedTimeSlot) {
      toast.error('Missing required information');
      return;
    }

    try {
      setIsProcessing(true);
      setPaymentError(null);

      // Calculate start and end times
      const startTime = new Date(state.selectedDate);
      const [startHour, startMinute] = state.selectedTimeSlot.start.split(':').map(Number);
      startTime.setHours(startHour, startMinute, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + state.selectedDuration);

      // Create session first
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          student_id: user.id,
          tutor_id: tutor.id,
          course_id: state.selectedCourseId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          location: state.location,
          notes: state.notes,
          session_type: state.sessionType,
          status: 'scheduled',
          payment_status: 'pending'
        })
        .select()
        .single();

      if (sessionError || !sessionData) {
        throw new Error('Failed to create session');
      }

      setSessionId(sessionData.id);

      // Create payment intent - keep amount in cents (already converted by backend)
      const amount = calculatedCost;
      
      const { data: paymentResponse, error: paymentError } = await supabase.functions.invoke(
        'create-payment-intent',
        {
          body: {
            sessionId: sessionData.id,
            amount: amount,
            tutorId: tutor.id,
            studentId: user.id,
            description: `Tutoring session with ${tutor.firstName || tutor.name}`
          }
        }
      );

      if (paymentError) {
        throw new Error(paymentResponse?.error || 'Failed to create payment intent');
      }

      const data = paymentResponse as CreatePIResponse;
      if (process.env.NODE_ENV !== 'production') {
        console.log('[PI]', { clientSecret: data?.client_secret?.slice(0,6) + '...', amount: data?.amount, res: data });
      }
      
      // Read client secret defensively
      const clientSecret = data?.client_secret ?? data?.clientSecret ?? null;
      
      if (!clientSecret) {
        console.error('create-payment-intent response:', data);
        setPaymentError('Could not get client secret from payment intent.');
        return;
      }

      setClientSecret(clientSecret);
      
    } catch (error) {
      console.error('Error creating session and payment intent:', error);
      setPaymentError(error instanceof Error ? error.message : 'Failed to setup payment');
      toast.error('Failed to setup payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = () => {
    onContinue(sessionId!, true);
  };

  const formatDateTime = () => {
    if (!state.selectedDate || !state.selectedTimeSlot) return '';
    
    const date = new Date(state.selectedDate);
    const [startHour, startMinute] = state.selectedTimeSlot.start.split(':').map(Number);
    date.setHours(startHour, startMinute, 0, 0);
    
    const endDate = new Date(date);
    endDate.setMinutes(endDate.getMinutes() + state.selectedDuration);
    
    return `${format(date, 'EEEE, MMMM d, yyyy')} at ${format(date, 'h:mm a')} - ${format(endDate, 'h:mm a')}`;
  };

  if (!publishableKey || isProcessing) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal mr-2" />
        <p>{!publishableKey ? 'Setting up payment...' : 'Processing...'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tutor:</span>
              <span className="font-medium">{tutor?.firstName || tutor?.name} {tutor?.lastName || ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Session:</span>
              <span className="font-medium">{formatDateTime()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Duration:</span>
              <span className="font-medium">{state.selectedDuration} minutes</span>
            </div>
            {state.selectedCourseId && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Course:</span>
                <span className="font-medium">{state.selectedCourseId}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>${calculatedCost.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentError && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm">{paymentError}</p>
            </div>
          )}
          
          {clientSecret && stripePromise && (
            <Elements 
              key={clientSecret} 
              stripe={stripePromise} 
              options={elementsOptions}
            >
              <PaymentForm 
                onSuccess={handlePaymentSuccess}
                sessionId={sessionId!}
                calculatedCost={calculatedCost}
              />
            </Elements>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}