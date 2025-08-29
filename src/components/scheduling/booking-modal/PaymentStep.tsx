import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { useScheduling } from '@/contexts/SchedulingContext';
import { useAuthState } from '@/hooks/useAuthState';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type * as stripeJs from '@stripe/stripe-js';
import { getStripe } from '@/lib/stripeClient';
import './payment-element.css';

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
  
  // State management
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [piSecret, setPiSecret] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [mounting, setMounting] = useState(false);
  const [ready, setReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasStripeIframe, setHasStripeIframe] = useState(false);
  
  // Enhanced debugging state
  const [requestMade, setRequestMade] = useState(false);
  const [responseReceived, setResponseReceived] = useState(false);
  const [requestUrl, setRequestUrl] = useState<string | null>(null);
  const [requestTimeout, setRequestTimeout] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);

  // Refs for stable Elements instances
  const containerRef = useRef<HTMLDivElement | null>(null);
  const elementsRef = useRef<stripeJs.StripeElements | null>(null);
  const paymentElementRef = useRef<stripeJs.StripePaymentElement | null>(null);
  const moRef = useRef<MutationObserver | null>(null);

  // Load publishable key on mount
  useEffect(() => {
    const loadStripeConfig = async () => {
      console.log('[pay] Fetching Stripe config...');
      try {
        const { data, error } = await supabase.functions.invoke('get-stripe-config');
        if (error) throw error;
        console.log('[pay] Got publishable key ending:', data.publishableKey?.slice(-6));
        setPublishableKey(data.publishableKey);
      } catch (error) {
        console.error('[pay] Failed to load Stripe config:', error);
        setError('Failed to initialize payment system');
      }
    };
    loadStripeConfig();
  }, []);

  // Create PaymentIntent when publishable key is ready
  useEffect(() => {
    if (!publishableKey || !user || !tutor || !state.selectedDate || !state.selectedTimeSlot) return;
    if (piSecret) return; // Already created

    createPaymentIntent();
  }, [publishableKey, user?.id, tutor?.id, state.selectedDate, state.selectedTimeSlot]);

  // Mount PaymentElement when publishableKey and piSecret are available
  useEffect(() => {
    if (!publishableKey || !piSecret || !containerRef.current) return;
    
    let cancelled = false;
    setMounting(true);
    setReady(false);
    setError(null);

    async function mountElement() {
      try {
        console.log('[pay] Elements init with PI secret last6:', piSecret.slice(-6));
        const stripe = await getStripe(publishableKey);
        if (!stripe || cancelled) return;

        // Create Elements WITH clientSecret (critical for PaymentIntent)
        const elements = stripe.elements({ clientSecret: piSecret });
        elementsRef.current = elements;

        // Create & mount Payment Element
        const paymentElement = elements.create('payment', { layout: 'tabs' });
        paymentElementRef.current = paymentElement;

        // Setup event listeners
        paymentElement.on('ready', () => {
          if (!cancelled) {
            console.log('[pay] PaymentElement ready');
            setReady(true);
            setMounting(false);
            
            // Check for iframe after a short delay
            setTimeout(() => {
              const iframes = Array.from(document.querySelectorAll('iframe'));
              const hasStripeIframe = iframes.some(f => f.src.includes('stripe.com'));
              console.log('[diag] iframe count', iframes.length);
              console.log('[diag] has stripe iframe', hasStripeIframe);
              setHasStripeIframe(hasStripeIframe);
            }, 120);
          }
        });

        paymentElement.on('loaderror', (event) => {
          if (!cancelled) {
            console.error('[pay] PaymentElement load error:', event);
            setError(event.error?.message || 'Failed to load payment form');
            setMounting(false);
          }
        });

        paymentElement.mount(containerRef.current!);
        console.log('[pay] PaymentElement mounted');

        // Setup MutationObserver to watch for iframe changes
        if (moRef.current) {
          moRef.current.disconnect();
        }
        
        const observer = new MutationObserver(() => {
          const hasIframe = !!document.querySelector('#payment-element iframe[src*="stripe.com"]');
          if (hasIframe !== hasStripeIframe) {
            console.log('[pay] Iframe status changed:', hasIframe);
            setHasStripeIframe(hasIframe);
          }
        });
        
        observer.observe(containerRef.current!, {
          childList: true,
          subtree: true
        });
        
        moRef.current = observer;

      } catch (error) {
        if (!cancelled) {
          console.error('[pay] Error mounting PaymentElement:', error);
          setError('Failed to initialize payment form');
          setMounting(false);
        }
      }
    }

    mountElement();

    return () => {
      cancelled = true;
      if (moRef.current) {
        moRef.current.disconnect();
        moRef.current = null;
      }
      try {
        paymentElementRef.current?.unmount();
      } catch (e) {
        console.log('[pay] Unmount error (non-fatal):', e);
      }
      paymentElementRef.current = null;
      elementsRef.current = null;
    };
  }, [publishableKey, piSecret]);

  const createPaymentIntent = async () => {
    if (!user || !tutor || !state.selectedDate || !state.selectedTimeSlot) {
      console.log('[pay] Missing required data for PI creation');
      return;
    }

    try {
      console.log('[pay] Creating session and PaymentIntent...');
      setError(null);
      setRequestMade(false);
      setResponseReceived(false);

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

      console.log('[pay] Session created:', sessionData.id);
      setSessionId(sessionData.id);

      // Reset debugging state
      setRequestMade(false);
      setResponseReceived(false);
      setRequestTimeout(false);
      setResponseStatus(null);
      setErrorType(null);
      
      // Prepare request body
      const requestBody = {
        sessionId: sessionData.id,
        amount: calculatedCost,
        tutorId: tutor.id,
        studentId: user.id,
        description: `Tutoring session with ${tutor.firstName || tutor.name}`
      };

      // Manual fetch with comprehensive debugging
      const url = `https://fzcyzjruixuriqzryppz.supabase.co/functions/v1/create-payment-intent`;
      setRequestUrl(url);
      
      console.log('[DEBUG 1]', new Date().toISOString(), 'Starting request to:', url);
      console.log('[DEBUG 2]', new Date().toISOString(), 'Request body:', requestBody);
      
      // Setup timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('[DEBUG TIMEOUT]', new Date().toISOString(), 'Request timeout after 10 seconds');
        setRequestTimeout(true);
        setErrorType('timeout');
        controller.abort();
      }, 10000);

      try {
        setRequestMade(true);
        
        // Get current session for auth header
        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6Y3l6anJ1aXh1cmlxenJ5cHB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5ODA5NTcsImV4cCI6MjA1NzU1Njk1N30.roxqC5QR4cIYpdLzwr20p_3ZVElpR9CUCJTOg_AuBhc'
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        setResponseReceived(true);
        setResponseStatus(response.status);
        
        console.log('[DEBUG 3]', new Date().toISOString(), 'Got response, status:', response.status);
        console.log('[DEBUG 4]', new Date().toISOString(), 'Response headers:', [...response.headers.entries()]);
        
        const responseText = await response.text();
        console.log('[DEBUG 5]', new Date().toISOString(), 'Raw response text:', responseText);
        
        if (!response.ok) {
          setErrorType('server');
          console.log('[DEBUG ERROR]', new Date().toISOString(), 'Server error response:', responseText);
          throw new Error(`HTTP ${response.status}: ${responseText}`);
        }

        // Try to parse as JSON
        const data = JSON.parse(responseText);
        console.log('[DEBUG 6]', new Date().toISOString(), 'Parsed JSON:', data);
        console.log('Available response fields:', Object.keys(data || {}));
        
        // Try multiple possible field names for robust client_secret extraction
        const clientSecret = data?.client_secret || 
                            data?.clientSecret || 
                            data?.['client-secret'] || 
                            data?.secret ||
                            data?.pi_client_secret;
        
        if (!clientSecret) {
          setErrorType('parse');
          console.error('No client_secret found. Available fields:', Object.keys(data || {}));
          setError(`No client_secret in server response. Got fields: ${Object.keys(data || {}).join(', ')}`);
          return;
        }

        console.log('Found client_secret ending in:', clientSecret.slice(-6));
        console.log('[pay] PaymentIntent created:', data?.id, 'secret last6:', clientSecret.slice(-6));

        setPiSecret(clientSecret);
        console.log('[pay] PI setup complete');
        
      } catch (error) {
        clearTimeout(timeoutId);
        setResponseReceived(true);
        
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            setErrorType('timeout');
            console.log('[DEBUG ERROR]', new Date().toISOString(), 'Request was aborted (timeout)');
          } else if (error.message.includes('Failed to fetch')) {
            setErrorType('network');
            console.log('[DEBUG ERROR]', new Date().toISOString(), 'Network error:', error.message);
          } else if (error.message.includes('JSON')) {
            setErrorType('parse');
            console.log('[DEBUG ERROR]', new Date().toISOString(), 'JSON parse error:', error.message);
          } else {
            setErrorType('unknown');
            console.log('[DEBUG ERROR]', new Date().toISOString(), 'Unknown error:', error.message);
          }
        }
        
        console.log('[DEBUG ERROR]', new Date().toISOString(), 'Error type:', error instanceof Error ? error.name : 'Unknown');
        console.log('[DEBUG ERROR]', new Date().toISOString(), 'Error message:', error instanceof Error ? error.message : String(error));
        console.log('[DEBUG ERROR]', new Date().toISOString(), 'Full error:', error);
        
        setError(error instanceof Error ? error.message : 'Failed to setup payment');
      }
      
    } catch (error) {
      console.error('[pay] Error creating PaymentIntent:', error);
      setError(error instanceof Error ? error.message : 'Failed to setup payment');
      setResponseReceived(true);
    }
  };

  const onPay = async () => {
    if (!publishableKey) {
      setError('Stripe not initialized');
      return;
    }

    console.log('[pay] Starting payment confirmation...');
    const stripe = await getStripe(publishableKey);
    const elements = elementsRef.current;
    
    if (!stripe || !elements) {
      console.error('[pay] Missing stripe/elements at confirm');
      setError('Payment form not ready');
      return;
    }
    
    setProcessing(true);
    setError(null);
    
    try {
      console.log('[pay] Calling confirmPayment...');
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });
      
      console.log('[pay] Confirm result:', { 
        error: error?.message, 
        status: paymentIntent?.status, 
        id: paymentIntent?.id 
      });
      
      if (error) {
        console.error('[pay] Payment error:', error);
        setError(error.message ?? 'Payment failed');
        return;
      }
      
      if (paymentIntent?.status === 'succeeded') {
        console.log('[pay] Payment succeeded!');
        toast.success('Payment successful!');
        onContinue(sessionId!, true);
      } else if (paymentIntent?.status === 'processing') {
        console.log('[pay] Payment processing...');
        toast.success('Payment is being processed');
        onContinue(sessionId!, true);
      } else {
        console.log('[pay] Unexpected payment status:', paymentIntent?.status);
        setError('Payment not completed');
      }
    } catch (err) {
      console.error('[pay] Exception during confirmation:', err);
      setError('Payment confirmation failed');
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

  if (!publishableKey) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal mr-2" />
        <p>Setting up payment...</p>
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
          {/* Comprehensive diagnostics panel */}
          <div style={{ fontSize: 12, background:'#f8f8f8', padding: 8, marginBottom: 16, fontFamily: 'monospace' }}>
            <div>PK last6: {publishableKey?.slice(-6) || 'NONE'}</div>
            <div>PI secret last6: {piSecret?.slice(-6) || 'NONE'}</div>
            <div>CS found: {piSecret ? 'YES' : 'NO'}</div>
            <div>Request made: {requestMade ? 'YES' : 'NO'}</div>
            <div>Response received: {responseReceived ? 'YES' : 'NO'}</div>
            <div>Request URL: {requestUrl || 'NONE'}</div>
            <div>Request timeout: {requestTimeout ? 'YES' : 'NO'}</div>
            <div>Response status: {responseStatus || 'NONE'}</div>
            <div>Error type: {errorType || 'none'}</div>
            <div>Mounted: {ready ? 'YES' : 'NO'}</div>
            <div>Stripe iframe: {hasStripeIframe ? 'YES' : 'NO'}</div>
            <div>Loading: {mounting ? 'YES' : 'NO'}</div>
            <div>Error: {error || 'NONE'}</div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Payment Element Container */}
          <div id="payment-element" ref={containerRef} style={{ minHeight: 84, display: 'block' }}>
            {mounting && !ready && (
              <div className="flex items-center justify-center h-20 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </div>
            )}
          </div>

          {!piSecret && publishableKey && !error && (
            <div className="text-center py-4 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
              Creating payment intent...
            </div>
          )}

          {/* Pay Button */}
          <Button
            onClick={onPay}
            disabled={!ready || processing || mounting || !piSecret}
            className="w-full bg-usc-cardinal hover:bg-usc-cardinal-dark mt-4"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing Payment...
              </>
            ) : (
              `Pay $${calculatedCost.toFixed(2)}`
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
