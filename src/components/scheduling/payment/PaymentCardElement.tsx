
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Check } from "lucide-react";
import { initializeStripe } from "@/lib/stripe-utils";

export interface PaymentCardElementProps {
  onCardElementReady: (cardElement: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  processing: boolean;
  loading: boolean;
  cardError: string | null;
  amount: number;
  stripeLoaded: boolean;
  clientSecret: string | null;
}

export const PaymentCardElement = ({
  onCardElementReady,
  onSubmit,
  onCancel,
  processing,
  loading,
  cardError,
  amount,
  stripeLoaded,
  clientSecret
}: PaymentCardElementProps) => {
  const [cardElementMounted, setCardElementMounted] = useState(false);

  useEffect(() => {
    const loadStripeCard = async () => {
      try {
        if (!cardElementMounted && window.document.getElementById('card-element')) {
          const stripe = await initializeStripe();
          const elements = stripe.elements();
          
          const cardElement = elements.create('card', {
            style: {
              base: {
                color: '#32325d',
                fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                fontSmoothing: 'antialiased',
                fontSize: '16px',
                '::placeholder': {
                  color: '#aab7c4'
                }
              },
              invalid: {
                color: '#fa755a',
                iconColor: '#fa755a'
              }
            }
          });
          
          cardElement.mount('#card-element');
          setCardElementMounted(true);
          onCardElementReady(cardElement);
        }
      } catch (error) {
        console.error('Error setting up card element:', error);
      }
    };
    
    if (clientSecret && !cardElementMounted) {
      loadStripeCard();
    }
  }, [clientSecret, cardElementMounted, onCardElementReady]);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <Label htmlFor="card-element" className="font-semibold mb-2 block">Payment Method</Label>
        <div className="mt-1 border rounded-md p-4 bg-white">
          {loading ? (
            <div className="h-10 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <div id="card-element" className="h-10"></div>
          )}
        </div>
        {cardError && (
          <p className="text-sm text-red-500 mt-1">{cardError}</p>
        )}
        
        <p className="text-sm text-gray-500 mt-2 flex items-center">
          <Check className="h-4 w-4 mr-1 text-green-500" />
          Your payment information is secure and encrypted
        </p>
      </div>
      
      <div className="pt-4">
        <Button
          type="submit"
          className="w-full bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
          disabled={loading || processing || !stripeLoaded || !clientSecret}
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay ${amount.toFixed(2)}
            </>
          )}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          className="w-full mt-2"
          onClick={onCancel}
          disabled={processing}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};
