import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { useScheduling } from '@/contexts/SchedulingContext';
import { useAuthState } from '@/hooks/useAuthState';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useStripeInitialization } from '@/components/scheduling/payment/hooks/useStripeInitialization';
import { useStripeElements } from '@/components/scheduling/payment/hooks/useStripeElements';

type CreatePIResponse = {
  id?: string;
  clientSecret?: string;
  client_secret?: string;
  payment_transaction_id?: string;
  environment?: 'test'|'live';
  two_stage_payment?: boolean;
  error?: string;
  [k: string]: any;
};

interface PaymentStepProps {
  onBack: () => void;
  onContinue: (sessionId: string, paymentSuccess: boolean) => void;
  calculatedCost?: number;
}

export function PaymentStep({ onBack, onContinue, calculatedCost = 0 }: PaymentStepProps) {
  const { state, tutor } = useScheduling();
  const { user } = useAuthState();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Initialize Stripe
  const { stripe, stripeLoaded, loading: stripeLoading } = useStripeInitialization();
  
  // Handle Stripe Elements - memoized to prevent recreation
  const { elements, cardElement, cardError, cardComplete } = useStripeElements(stripe, clientSecret, stripeLoaded);

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

      // Create payment intent - send amount as received (backend will handle cents conversion)
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
      if (process.env.NODE_ENV !== 'production') console.log('PI resp', data);
      
      const clientSecret =
        data.clientSecret ?? data.client_secret ?? data.payment_intent_client_secret ?? null;
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

  const handlePayment = useCallback(async () => {
    if (!stripe || !elements || !clientSecret) {
      toast.error('Payment system not ready');
      return;
    }

    try {
      setIsProcessing(true);
      setPaymentError(null);

      // Dev-only: Check Stripe key compatibility
      if (process.env.NODE_ENV !== 'production') {
        try {
          console.debug('Running Stripe diagnostics check...');
          const diagnosticsResponse = await supabase.functions.invoke('stripe-diagnostics');
          
          if (diagnosticsResponse.data && !diagnosticsResponse.error) {
            const diagnostics = diagnosticsResponse.data;
            console.debug('Stripe diagnostics:', diagnostics);
            
            // Get frontend publishable key (from same source as Stripe initialization)
            const frontendKeyResponse = await supabase.functions.invoke('get-stripe-config');
            if (frontendKeyResponse.data && !frontendKeyResponse.error) {
              const frontendKey = frontendKeyResponse.data.publishableKey;
              const frontendLast4 = frontendKey?.slice(-4);
              const serverLast4 = diagnostics.expected_publishable_key_last4;
              
              if (frontendLast4 !== serverLast4) {
                setPaymentError(
                  `Stripe keys mismatch: frontend pk (...${frontendLast4}) ≠ server pk (...${serverLast4}). Use the same Stripe account/sandbox for both client and server.`
                );
                setIsProcessing(false);
                return;
              }
            }
          }
        } catch (diagError) {
          console.debug('Diagnostics check failed, continuing with payment:', diagError);
          // Continue with payment if diagnostics fail
        }
      }

      console.log('Starting payment confirmation...');
      const { error: paymentError } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: window.location.href
        }
      });

      if (paymentError) {
        console.error('Stripe payment error:', paymentError);
        setPaymentError(paymentError.message || 'Payment failed');
        toast.error(paymentError.message || 'Payment failed');
        return;
      }

      // Payment successful
      toast.success('Payment successful!');
      onContinue(sessionId!, true);
      
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
      setPaymentError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [stripe, elements, clientSecret, sessionId, onContinue]);

  const formatDateTime = () => {
    if (!state.selectedDate || !state.selectedTimeSlot) return '';
    
    const date = new Date(state.selectedDate);
    const [startHour, startMinute] = state.selectedTimeSlot.start.split(':').map(Number);
    date.setHours(startHour, startMinute, 0, 0);
    
    const endDate = new Date(date);
    endDate.setMinutes(endDate.getMinutes() + state.selectedDuration);
    
    return `${format(date, 'EEEE, MMMM d, yyyy')} at ${format(date, 'h:mm a')} - ${format(endDate, 'h:mm a')}`;
  };

  if (stripeLoading || isProcessing) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal mr-2" />
        <p>{stripeLoading ? 'Setting up payment...' : 'Processing...'}</p>
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
          
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div id="card-element" className="min-h-[40px]">
                {/* Stripe Elements will mount here */}
              </div>
            </div>
            
            {cardError && (
              <p className="text-destructive text-sm">{cardError}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isProcessing}>
          Back
        </Button>
        <Button 
          onClick={handlePayment}
          disabled={isProcessing || !stripeLoaded || !clientSecret || !cardComplete}
          className="bg-usc-cardinal hover:bg-usc-cardinal-dark"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            `Pay $${calculatedCost.toFixed(2)}`
          )}
        </Button>
      </div>
    </div>
  );
}