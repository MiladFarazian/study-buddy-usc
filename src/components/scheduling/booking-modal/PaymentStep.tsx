import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { useScheduling } from '@/contexts/SchedulingContext';
import { useAuthState } from '@/hooks/useAuthState';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { loadStripe, StripeCardNumberElement } from '@stripe/stripe-js';

type CreatePIResponse = {
  id?: string;
  clientSecret?: string;
  client_secret?: string;
  paymentIntent?: {
    client_secret?: string;
  };
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
  const [isPaying, setIsPaying] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardElementRef, setCardElementRef] = useState<any>(null);

  // Memoize Stripe promise based on publishable key
  const stripePromise = useMemo(() => {
    if (!publishableKey) return null;
    if (process.env.NODE_ENV !== 'production') {
      console.log('[stripe] pk last6:', publishableKey?.slice(-6));
    }
    return loadStripe(publishableKey);
  }, [publishableKey]);

  // Memoize Elements instance based on client secret
  const elementsOptions = useMemo(() => {
    if (!clientSecret) return null;
    if (process.env.NODE_ENV !== 'production') {
      console.log('[stripe] cs last6:', clientSecret?.slice(-6));
    }
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
      if (process.env.NODE_ENV !== 'production') console.log('PI resp', data);
      
      // Read client secret defensively
      const clientSecret =
        data?.client_secret ?? data?.clientSecret ?? data?.paymentIntent?.client_secret ?? null;
      
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
    // Guard: check all required elements
    if (!publishableKey || !clientSecret) {
      setPaymentError('Payment system not ready - missing configuration');
      return;
    }

    // Prevent double-submit
    if (isPaying) return;

    try {
      setIsPaying(true);
      setIsProcessing(true);
      setPaymentError(null);

      const stripe = await stripePromise;
      if (!stripe) {
        setPaymentError('Failed to load Stripe');
        return;
      }

      // Get the card element
      if (!cardElementRef) {
        setPaymentError('Payment form not ready');
        return;
      }

      // Confirm payment with card element
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElementRef,
        },
      });

      if (error) {
        console.error('Stripe payment error:', error);
        setPaymentError(error.message || 'Payment failed');
        return;
      }

      // Handle different payment statuses
      if (paymentIntent?.status === 'succeeded') {
        toast.success('Payment successful!');
        onContinue(sessionId!, true);
      } else if (paymentIntent?.status === 'requires_payment_method') {
        setPaymentError('Your card was declined. Please try another payment method.');
      } else {
        setPaymentError('Payment could not be processed. Please try again.');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
      setPaymentError(errorMessage);
    } finally {
      setIsPaying(false);
      setIsProcessing(false);
    }
  }, [stripePromise, clientSecret, sessionId, onContinue, isPaying, publishableKey, cardElementRef]);

  // Mount Stripe Elements when ready
  useEffect(() => {
    if (!stripePromise || !elementsOptions) return;

    const mountElements = async () => {
      const stripe = await stripePromise;
      if (!stripe) return;

      const elements = stripe.elements(elementsOptions);
      const cardElement = elements.create('cardNumber', {
        style: {
          base: {
            fontSize: '16px',
            fontFamily: 'system-ui, sans-serif',
            '::placeholder': {
              color: '#aab7c4',
            },
          },
          invalid: {
            color: '#ff5555',
          },
        },
      });

      const cardContainer = document.getElementById('card-element');
      if (cardContainer) {
        cardContainer.innerHTML = '';
        cardElement.mount('#card-element');
        setCardElementRef(cardElement);

        cardElement.on('change', (event: any) => {
          setCardError(event.error ? event.error.message : '');
          setCardComplete(event.complete);
        });
      }
    };

    mountElements();
  }, [stripePromise, elementsOptions]);

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
          
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div id="card-element" className="min-h-[40px]">
                {/* Stripe Card Element will mount here */}
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
        <Button variant="outline" onClick={onBack} disabled={isPaying}>
          Back
        </Button>
        <Button 
          onClick={handlePayment}
          disabled={isPaying || !clientSecret || !cardComplete}
          className="bg-usc-cardinal hover:bg-usc-cardinal-dark"
        >
          {isPaying ? (
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