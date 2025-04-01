
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Check, AlertTriangle } from "lucide-react";
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
  const [stripe, setStripe] = useState<any>(null);
  const [elements, setElements] = useState<any>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardElementMounted, setCardElementMounted] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load Stripe.js and create Elements instance
  useEffect(() => {
    const loadStripe = async () => {
      try {
        if (!stripe && clientSecret) {
          const stripeInstance = await initializeStripe();
          setStripe(stripeInstance);
          
          const elementsInstance = stripeInstance.elements({
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#990000', // USC Cardinal
                colorBackground: '#ffffff',
                colorText: '#1a1a1a',
                colorDanger: '#ff5555',
                fontFamily: 'system-ui, sans-serif',
                borderRadius: '8px',
              },
            },
          });
          
          setElements(elementsInstance);
        }
      } catch (error) {
        console.error('Error setting up Stripe:', error);
        setLoadError('Could not initialize payment system. Please refresh and try again.');
      }
    };
    
    if (clientSecret && !stripe) {
      loadStripe();
    }
  }, [clientSecret, stripe]);

  // Create and mount the Card Element
  useEffect(() => {
    if (elements && !cardElementMounted) {
      try {
        const cardElement = elements.create('card', {
          style: {
            base: {
              fontSize: '16px',
              fontFamily: 'system-ui, sans-serif',
              color: '#32325d',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
            invalid: {
              color: '#fa755a',
              iconColor: '#fa755a',
            },
          },
        });
        
        const cardContainer = document.getElementById('card-element');
        if (cardContainer) {
          cardElement.mount('#card-element');
          setCardElementMounted(true);
          
          cardElement.on('change', (event: any) => {
            setCardComplete(event.complete);
            if (event.error) {
              console.error('Card element error:', event.error.message);
            }
          });
          
          onCardElementReady(cardElement);
        }
        
        // Cleanup function
        return () => {
          if (cardElementMounted) {
            cardElement.unmount();
          }
        };
      } catch (error) {
        console.error('Error creating card element:', error);
        setLoadError('Could not create payment form. Please refresh and try again.');
      }
    }
  }, [elements, cardElementMounted, onCardElementReady]);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <Label htmlFor="card-element" className="font-semibold mb-2 block">Payment Method</Label>
        <div className="mt-1 border rounded-md p-4 bg-white">
          {loading || !stripeLoaded ? (
            <div className="h-10 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : loadError ? (
            <div className="h-10 flex items-center justify-center text-red-500">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span className="text-sm">{loadError}</span>
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
          disabled={loading || processing || !stripeLoaded || !clientSecret || !cardComplete || !!loadError}
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
      
      {!clientSecret && !loading && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md mt-4">
          <p className="text-sm text-amber-800 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2 text-amber-600" />
            Payment system not fully connected. Please ensure Stripe is properly configured.
          </p>
        </div>
      )}
    </form>
  );
};
