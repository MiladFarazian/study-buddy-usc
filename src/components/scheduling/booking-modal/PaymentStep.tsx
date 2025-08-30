import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '@/integrations/supabase/client';

const stripePromise = loadStripe('pk_test_51S1BBTPF6HhVb1F0NhXFw6kGTrwwTMu3s8hkuNDL0pv8xKjC5XTyYojzJhJoEClse0JZBabTWzEOCGRu1mNHHKIx00Pc6ue6SD');

function PaymentForm({ tutorId, sessionId, amountCents, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
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
        setError(confirmError.message);
      } else {
        onSuccess?.();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      {error && (
        <div className="text-red-600 bg-red-50 p-2 rounded text-sm">{error}</div>
      )}
      
      <button
        type="submit"
        disabled={!stripe || !elements || processing}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50"
      >
        {processing ? 'Processing...' : `Pay $${(amountCents / 100).toFixed(2)}`}
      </button>
    </form>
  );
}

export default function PaymentStep({ onBack, onContinue, calculatedCost }) {
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Mock values for testing - in real app these would come from context/props
  const tutorId = 'test-tutor-id';
  const sessionId = 'test-session-id';
  const amountCents = calculatedCost * 100;

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('create-payment-intent', {
          body: { tutorId, sessionId, amount: amountCents }
        });
        
        if (fnError) throw fnError;
        if (!data?.client_secret) throw new Error('No client_secret returned');
        
        setClientSecret(data.client_secret);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [tutorId, sessionId, amountCents]);

  const handlePaymentSuccess = () => {
    onContinue?.('test-session-id', true);
  };

  if (loading) return <div className="p-4">Loading payment...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!clientSecret) return <div className="p-4">No payment setup</div>;

  return (
    <div className="p-4">
      <h3 className="text-lg font-medium mb-4">Payment: ${(amountCents / 100).toFixed(2)}</h3>
      
      <Elements 
        stripe={stripePromise} 
        options={{ 
          clientSecret,
          appearance: { theme: 'stripe' }
        }}
      >
        <PaymentForm 
          tutorId={tutorId}
          sessionId={sessionId}
          amountCents={amountCents}
          onSuccess={handlePaymentSuccess}
        />
      </Elements>
      
      <div className="mt-4">
        <button
          onClick={onBack}
          className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded"
        >
          Back
        </button>
      </div>
    </div>
  );
}