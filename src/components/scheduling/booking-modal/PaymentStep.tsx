import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';
import { useScheduling } from '@/contexts/SchedulingContext';
import { useAuthState } from '@/hooks/useAuthState';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const stripePromise = loadStripe('pk_test_51S1BBTPF6HhVb1F0NhXFw6kGTrwwTMu3s8hkuNDL0pv8xKjC5XTyYojzJhJoEClse0JZBabTWzEOCGRu1mNHHKIx00Pc6ue6SD');

interface PaymentStepProps {
  onBack: () => void;
  onContinue: (sessionId: string, paymentSuccess: boolean) => void;
  calculatedCost?: number;
}

function PaymentForm({ sessionId, onSuccess }: { sessionId: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) return;
    
    setProcessing(true);
    setError('');
    
    try {
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required'
      });
      
      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Payment processing error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      {error && (
        <div className="text-destructive bg-destructive/10 p-3 rounded border border-destructive/20 text-sm">
          {error}
        </div>
      )}
      
      <Button
        type="submit"
        disabled={!stripe || !elements || processing}
        className="w-full"
      >
        {processing ? 'Processing...' : 'Complete Payment'}
      </Button>
    </form>
  );
}

export function PaymentStep({ onBack, onContinue, calculatedCost = 0 }: PaymentStepProps) {
  const { state, tutor } = useScheduling();
  const { user } = useAuthState();
  
  const [clientSecret, setClientSecret] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!user || !tutor || !state.selectedDate || !state.selectedTimeSlot) {
        setError('Missing required data');
        setLoading(false);
        return;
      }

      try {
        console.log('Creating session first...');
        
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

        console.log('Session created:', sessionData.id);
        setSessionId(sessionData.id);
        
        console.log('Calling Edge Function...');
        
        const { data, error: fnError } = await supabase.functions.invoke('create-payment-intent', {
          body: { 
            sessionId: sessionData.id,
            amount: calculatedCost,
            tutorId: tutor.id,
            studentId: user.id,
            description: `Tutoring session with ${tutor.firstName || tutor.name}`
          }
        });
        
        if (fnError) throw fnError;
        if (!data?.client_secret) throw new Error('No client_secret returned');
        
        console.log('Success! Got client_secret:', data.client_secret.slice(-6));
        setClientSecret(data.client_secret);
        
      } catch (err: any) {
        console.error('Payment setup failed:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [user, tutor, state.selectedDate, state.selectedTimeSlot, state.selectedDuration, calculatedCost]);

  const formatDateTime = () => {
    if (!state.selectedDate || !state.selectedTimeSlot) return '';
    
    const date = new Date(state.selectedDate);
    const [startHour, startMinute] = state.selectedTimeSlot.start.split(':').map(Number);
    date.setHours(startHour, startMinute, 0, 0);
    
    const endDate = new Date(date);
    endDate.setMinutes(endDate.getMinutes() + state.selectedDuration);
    
    return `${format(date, 'EEEE, MMMM d, yyyy')} at ${format(date, 'h:mm a')} - ${format(endDate, 'h:mm a')}`;
  };

  const handlePaymentSuccess = () => {
    if (sessionId) {
      onContinue(sessionId, true);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2">Setting up payment...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-destructive">Error: {error}</div>
            <Button onClick={onBack} variant="outline" className="mt-4">
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret || !sessionId) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-muted-foreground">No payment setup available</div>
            <Button onClick={onBack} variant="outline" className="mt-4">
              Back
            </Button>
          </CardContent>
        </Card>
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
        <CardContent className="p-6">
          <Elements 
            stripe={stripePromise} 
            options={{ 
              clientSecret,
              appearance: { 
                theme: 'stripe',
                variables: {
                  colorPrimary: 'hsl(var(--primary))',
                  colorBackground: 'hsl(var(--background))',
                  colorText: 'hsl(var(--foreground))',
                  colorDanger: 'hsl(var(--destructive))',
                  fontFamily: 'system-ui, sans-serif',
                  borderRadius: '8px',
                }
              }
            }}
          >
            <PaymentForm 
              sessionId={sessionId}
              onSuccess={handlePaymentSuccess}
            />
          </Elements>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="flex-1"
        >
          Back
        </Button>
      </div>
    </div>
  );
}