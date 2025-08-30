import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '@/integrations/supabase/client';

const stripePromise = loadStripe('pk_test_51QO7kcP0YxO7kcGjfEQTyLsOhKFgF7XvqWk1JQ2Ua1U3zNsJKOmAXwL7GdY8vg4oM6Kz3r9KcF8vqVdL3QJEZ7ze00SJ8aFoPs');

function CardForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setMessage('Processing...');
    
    const {error} = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Payment succeeded!');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto">
      <PaymentElement />
      <button 
        disabled={!stripe}
        className="mt-4 w-full py-3 px-4 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
      >
        Pay $33.00
      </button>
      {message && <div className="mt-4 text-sm text-center">{message}</div>}
    </form>
  );
}

export function PaymentStep({ onBack, onContinue, calculatedCost }: { onBack?: () => void; onContinue?: (sessionId: string, paymentSuccess: boolean) => void; calculatedCost?: number }) {
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Use known working values for testing
    supabase.functions.invoke('create-payment-intent', {
      body: { 
        tutorId: 'test-tutor', 
        sessionId: 'test-session', 
        amount: 3300 
      }
    }).then(({data}) => {
      if (data?.client_secret) {
        setClientSecret(data.client_secret);
      }
    });
  }, []);

  if (!clientSecret) return <div className="text-center">Loading...</div>;

  return (
    <Elements stripe={stripePromise} options={{clientSecret}}>
      <CardForm />
    </Elements>
  );
}