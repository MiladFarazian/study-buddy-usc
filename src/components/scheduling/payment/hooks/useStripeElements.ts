
import { useState, useEffect } from "react";

/**
 * Hook for creating and managing Stripe Elements
 */
export function useStripeElements(stripe: any, clientSecret: string | null, stripeReady: boolean) {
  const [elements, setElements] = useState<any>(null);
  const [cardElement, setCardElement] = useState<any>(null);
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState<boolean>(false);
  
  // Create Elements instance when Stripe and client secret are available
  useEffect(() => {
    if (!stripe || !clientSecret || !stripeReady) return;
    
    try {
      console.log('Creating Elements instance with client secret');
      const elementsInstance = stripe.elements({
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#990000',
            colorBackground: '#ffffff',
            colorText: '#1a1a1a',
            colorDanger: '#ff5555',
            fontFamily: 'system-ui, sans-serif',
            borderRadius: '8px',
          },
        },
      });

      setElements(elementsInstance);
    } catch (error) {
      console.error('Error creating Stripe Elements:', error);
    }
  }, [stripe, clientSecret, stripeReady]);

  // Mount card element when Elements is available
  useEffect(() => {
    if (!elements) return;
    
    const cardContainer = document.getElementById('card-element');
    if (!cardContainer) {
      console.warn('Card element container not found');
      return;
    }
    
    try {
      cardContainer.innerHTML = '';
      
      console.log('Creating and mounting card element');
      const card = elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            fontFamily: 'system-ui, sans-serif',
            '::placeholder': {
              color: '#aab7c4',
            },
          },
          invalid: {
            color: '#ff5555',
          },
        },
      });

      card.mount('#card-element');
      setCardElement(card);

      card.on('change', (event: any) => {
        setCardError(event.error ? event.error.message : '');
        setCardComplete(event.complete);
      });

      return () => {
        card.unmount();
      };
    } catch (error) {
      console.error('Error mounting card element:', error);
    }
  }, [elements]);
  
  return {
    elements,
    cardElement,
    cardError,
    cardComplete,
    setCardError
  };
}
