import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuthState } from '@/hooks/useAuthState';
import { useScheduling } from '@/contexts/SchedulingContext';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { Tutor } from '@/types/tutor';
import { getStripe } from '@/lib/stripeClient';

// Get Stripe publishable key based on environment
const getStripeKey = () => {
  // For now, always use test key since we're in development
  return 'pk_test_51QO7kcP0YxO7kcGjfEQTyLsOhKFgF7XvqWk1JQ2Ua1U3zNsJKOmAXwL7GdY8vg4oM6Kz3r9KcF8vqVdL3QJEZ7ze00SJ8aFoPs';
};

interface PaymentFormProps {
  amount: number;
  onPaymentComplete: () => void;
}

function PaymentForm({ amount, onPaymentComplete }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || processing) return;

    setProcessing(true);
    setMessage('Processing payment...');
    
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
    });

    if (error) {
      setMessage(error.message || 'Payment failed');
      setProcessing(false);
    } else {
      setMessage('Payment succeeded!');
      onPaymentComplete();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Payment Details</h3>
        <p className="text-muted-foreground">
          Total: ${(amount / 100).toFixed(2)}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <PaymentElement />
        
        <Button 
          type="submit"
          disabled={!stripe || processing}
          className="w-full bg-usc-cardinal hover:bg-usc-cardinal-dark"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            `Pay $${(amount / 100).toFixed(2)}`
          )}
        </Button>
        
        {message && (
          <div className={`text-sm text-center ${
            message.includes('succeeded') ? 'text-green-600' : 'text-destructive'
          }`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}

interface PaymentStepProps {
  onBack?: () => void;
  onContinue?: (sessionId: string, paymentSuccess: boolean) => void;
  calculatedCost?: number;
  tutor: Tutor;
}

export function PaymentStep({ onBack, onContinue, calculatedCost, tutor }: PaymentStepProps) {
  const { user, loading: authLoading } = useAuthState();
  const { state } = useScheduling();
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false);
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);

  // Initialize Stripe
  useEffect(() => {
    const key = getStripeKey();
    setStripePromise(getStripe(key));
  }, []);

  // Create payment intent when user and booking data are available
  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!user || !state.selectedTimeSlot || !tutor || clientSecret) return;

      setIsCreatingPaymentIntent(true);
      setError(null);

      try {
        const sessionId = `session_${Date.now()}_${user.id}`;
        const amount = calculatedCost ? Math.round(calculatedCost * 100) : 3300; // Convert to cents

        console.log('Creating payment intent with:', {
          sessionId,
          amount,
          tutorId: tutor.id,
          studentId: user.id
        });

        const { data, error: invokeError } = await supabase.functions.invoke('create-payment-intent', {
          body: { 
            sessionId,
            amount,
            tutorId: tutor.id,
            studentId: user.id
          }
        });

        if (invokeError) {
          console.error('Payment intent error:', invokeError);
          setError(invokeError.message || 'Failed to create payment intent');
          return;
        }

        if (data?.client_secret) {
          setClientSecret(data.client_secret);
        } else {
          setError('No client secret received from payment service');
        }
      } catch (err: any) {
        console.error('Payment intent creation failed:', err);
        setError(err.message || 'Failed to initialize payment');
      } finally {
        setIsCreatingPaymentIntent(false);
      }
    };

    createPaymentIntent();
  }, [user, state.selectedTimeSlot, tutor, calculatedCost, clientSecret]);

  const handlePaymentComplete = () => {
    const sessionId = `session_${Date.now()}_${user?.id}`;
    onContinue?.(sessionId, true);
  };

  // Show loading state while auth or payment setup is in progress
  if (authLoading || isCreatingPaymentIntent) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal" />
        <p className="text-muted-foreground">
          {authLoading ? 'Checking authentication...' : 'Setting up payment...'}
        </p>
      </div>
    );
  }

  // Show authentication required state
  if (!user) {
    return (
      <div className="text-center py-8 space-y-4">
        <AlertCircle className="h-12 w-12 text-orange-500 mx-auto" />
        <div>
          <h3 className="text-lg font-semibold">Authentication Required</h3>
          <p className="text-muted-foreground">
            Please log in to continue with your booking payment.
          </p>
        </div>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={() => window.location.href = '/login'}>
            Log In
          </Button>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="text-center py-8 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <div>
          <h3 className="text-lg font-semibold">Payment Setup Error</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state while waiting for client secret
  if (!clientSecret || !stripePromise) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal" />
        <p className="text-muted-foreground">Loading payment form...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <PaymentForm 
          amount={calculatedCost ? Math.round(calculatedCost * 100) : 3300}
          onPaymentComplete={handlePaymentComplete}
        />
      </Elements>
      
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}