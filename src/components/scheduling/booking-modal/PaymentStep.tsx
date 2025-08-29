import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { useScheduling } from '@/contexts/SchedulingContext';
import { useAuthState } from '@/hooks/useAuthState';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { loadStripe } from '@stripe/stripe-js';
import type * as stripeJs from '@stripe/stripe-js';
import './payment-element.css';

// Module-level Stripe promise
let stripePromise: Promise<stripeJs.Stripe | null> | null = null;

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

export function PaymentStep({ onBack, onContinue, calculatedCost = 0 }: PaymentStepProps) {
  const { state, tutor } = useScheduling();
  const { user } = useAuthState();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const elementsRef = useRef<stripeJs.StripeElements | null>(null);
  const paymentElementRef = useRef<stripeJs.StripePaymentElement | null>(null);

  // Initialize Stripe promise when we get the publishable key
  useEffect(() => {
    if (publishableKey && !stripePromise) {
      console.log('[pay] Initializing Stripe with key:', publishableKey.substring(0, 12) + '...');
      stripePromise = loadStripe(publishableKey);
    }
  }, [publishableKey]);

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

  // Mount PaymentElement when clientSecret is available
  useEffect(() => {
    let cancelled = false;
    
    async function mountElement() {
      setIsReady(false);
      const stripe = await stripePromise;
      if (!stripe || !clientSecret || !containerRef.current) return;
      
      console.log('[pay] build elements with cs last6:', clientSecret.slice(-6));

      // Create Elements WITH clientSecret (critical)
      const elements = stripe.elements({ clientSecret });
      elementsRef.current = elements;

      // Create & mount Payment Element
      const pe = elements.create('payment', { layout: 'tabs' });
      paymentElementRef.current = pe;
      
      pe.on('ready', () => {
        if (!cancelled) {
          setIsReady(true);
          console.log('[pay] PaymentElement ready; iframe count:', document.querySelectorAll('#payment-element iframe').length);
        }
      });
      
      pe.mount(containerRef.current);
    }

    if (clientSecret) {
      mountElement();
    }

    return () => {
      cancelled = true;
      try { 
        paymentElementRef.current?.unmount(); 
      } catch {}
      paymentElementRef.current = null;
    };
  }, [clientSecret]);

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
      console.log('[sb] PI', data?.id, 'secret tail', data?.client_secret?.slice(-6));
      
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

  const onPay = async () => {
    const stripe = await stripePromise;
    const elements = elementsRef.current;
    if (!stripe || !elements) {
      console.error('[pay] missing stripe/elements at confirm');
      setError('Payment form not ready.');
      return;
    }
    
    setProcessing(true);
    setError(null);
    
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });
      
      console.log('[pay] confirm result:', { error: error?.message, status: paymentIntent?.status, id: paymentIntent?.id });
      
      if (error) {
        setError(error.message ?? 'Payment failed');
        return;
      }
      
      if (paymentIntent?.status === 'succeeded') {
        toast.success('Payment successful!');
        onContinue(sessionId!, true);
      } else {
        setError('Payment not completed');
      }
    } finally {
      setProcessing(false);
    }
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
          {/* Dev-only debug panel */}
          {process.env.NODE_ENV !== 'production' && (
            <pre style={{ fontSize: 12, background:'#f8f8f8', padding:8, marginBottom: 16 }}>
              Debug:
              pk: {publishableKey?.slice(-6)}
              cs: {clientSecret?.slice(-6)}
              ready: {String(isReady)}
              iframe: {String(!!document.querySelector('#payment-element iframe'))}
            </pre>
          )}

          {paymentError && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm">{paymentError}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Stable mount target that stays in the DOM */}
          <div id="payment-element" ref={containerRef} style={{ minHeight: 84, display: 'block' }} />

          {!clientSecret && publishableKey && (
            <div className="text-center py-4">Creating payment intent...</div>
          )}

          {/* Pay Button */}
          <Button
            onClick={onPay}
            disabled={!isReady || processing}
            className="w-full bg-usc-cardinal hover:bg-usc-cardinal-dark mt-4"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              'Pay'
            )}
          </Button>
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
