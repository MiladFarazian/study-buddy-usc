
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";
import { initializeStripe } from "@/lib/stripe-utils";

interface PaymentCardElementProps {
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
  useEffect(() => {
    const loadStripeCard = async () => {
      try {
        // Initialize Stripe
        const stripe = await initializeStripe();
        const elements = stripe.elements();
        
        // Create the card element with improved styling
        const cardEl = elements.create('card', {
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
        
        // Mount card element when DOM is ready
        setTimeout(() => {
          const cardContainer = document.getElementById('card-element');
          if (cardContainer) {
            cardEl.mount('#card-element');
            onCardElementReady(cardEl);
          }
        }, 100);
      } catch (error) {
        console.error('Error setting up card element:', error);
      }
    };
    
    loadStripeCard();
  }, [onCardElementReady]);

  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="card-element">Card Details</Label>
          <div className="mt-1 border rounded-md p-3 bg-white">
            {loading ? (
              <div className="h-10 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div id="card-element" className="h-10 flex items-center"></div>
            )}
          </div>
          {cardError && (
            <p className="text-sm text-destructive mt-1">{cardError}</p>
          )}
        </div>
        
        <div className="pt-4">
          <Button
            type="submit"
            className="w-full bg-usc-cardinal hover:bg-usc-cardinal-dark"
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
      </div>
    </form>
  );
};
