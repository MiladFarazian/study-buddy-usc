import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { Tutor } from '@/types/tutor';

// Stripe test publishable key
const stripePromise = loadStripe('pk_test_51QO7kcP0YxO7kcGjfEQTyLsOhKFgF7XvqWk1JQ2Ua1U3zNsJKOmAXwL7GdY8vg4oM6Kz3r9KcF8vqVdL3QJEZ7ze00SJ8aFoPs');

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

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setProcessing(true);
    setMessage('Processing payment...');
    
    // Create a test payment method
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      setMessage(error.message || 'Payment failed');
      setProcessing(false);
    } else {
      // For test mode, we'll simulate a successful payment
      setTimeout(() => {
        setMessage('Payment succeeded!');
        setProcessing(false);
        onPaymentComplete();
      }, 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <CreditCard className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold">Payment Details</h3>
        </div>
        <p className="text-muted-foreground">
          Total: ${(amount / 100).toFixed(2)}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border rounded-lg p-4">
          <label className="block text-sm font-medium mb-2">Card Information</label>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
        
        <Button 
          type="submit"
          disabled={!stripe || processing}
          className="w-full"
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
  const handlePaymentComplete = () => {
    const sessionId = `session_${Date.now()}_${tutor.id}`;
    onContinue?.(sessionId, true);
  };

  return (
    <div className="space-y-6">
      <Elements stripe={stripePromise}>
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