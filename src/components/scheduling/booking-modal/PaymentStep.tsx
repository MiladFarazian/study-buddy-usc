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

const stripePromise = loadStripe('pk_test_51Pp3rQCnpJUIJrEVdyHNiNhgCwQfLvYHe4A1MlPSG6Cp06fEKJgLa2CUCcOXgIUKl6nHVv5Q2b4VInQmWBpDmkfX00YlULdGrV');

interface PaymentStepProps {
  onBack: () => void;
  onContinue: (sessionId: string, paymentSuccess: boolean) => void;
  calculatedCost?: number;
}

interface PaymentFormProps {
  clientSecret: string;
  sessionId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function PaymentForm({ clientSecret, sessionId, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) return;
    
    setProcessing(true);
    
    try {
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required'
      });
      
      if (confirmError) {
        onError(confirmError.message || 'Payment failed');
      } else {
        // Update session payment status
        await supabase
          .from('sessions')
          .update({ payment_status: 'paid' })
          .eq('id', sessionId);
        
        onSuccess();
      }
    } catch (err: any) {
      onError(err.message || 'Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || !elements || processing}
        className="w-full bg-primary hover:bg-primary/90"
      >
        {processing ? 'Processing Payment...' : 'Complete Payment'}
      </Button>
    </form>
  );
}

export function PaymentStep({ onBack, onContinue, calculatedCost = 0 }: PaymentStepProps) {
  const { state, tutor } = useScheduling();
  const { user } = useAuthState();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const createSessionAndPaymentIntent = async () => {
    if (!user || !tutor || !state.selectedDate || !state.selectedTimeSlot) {
      setError('Missing required data');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
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
      
      // Create payment intent
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
      if (!data?.client_secret) throw new Error('No client_secret in response');
      
      setClientSecret(data.client_secret);
      
    } catch (err: any) {
      console.error('Setup failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    createSessionAndPaymentIntent();
  }, []);

  const handlePaymentSuccess = () => {
    if (sessionId) {
      onContinue(sessionId, true);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Setting up payment...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !clientSecret) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="text-red-600 bg-red-50 p-3 rounded border border-red-200">
                {error}
              </div>
              <div className="flex gap-4">
                <Button variant="outline" onClick={onBack} className="flex-1">
                  Back
                </Button>
                <Button onClick={createSessionAndPaymentIntent} className="flex-1">
                  Try Again
                </Button>
              </div>
            </div>
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
            Complete Payment
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
      {clientSecret && sessionId && (
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
                clientSecret={clientSecret}
                sessionId={sessionId}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </Elements>
          </CardContent>
        </Card>
      )}
      
      {error && (
        <div className="text-destructive bg-destructive/10 p-3 rounded border border-destructive/20">
          {error}
        </div>
      )}

      {/* Back Button */}
      <div className="flex justify-start">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}