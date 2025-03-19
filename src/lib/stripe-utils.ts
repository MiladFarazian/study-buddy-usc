
import { supabase } from "@/integrations/supabase/client";

const STRIPE_PUBLIC_KEY = "pk_test_51Ok0zXRnDQljLWdZVYc5mUPORgYEO64gQUe2HH5YqtdrmDZPXI9p4RR0yiiwI7YPVXcqLcSjn7Pp4RLY2PVWxdZv00URQjH9Cg";

export interface StripePaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
}

// Initialize Stripe
export const initializeStripe = () => {
  return new Promise<any>((resolve, reject) => {
    if ((window as any).Stripe) {
      resolve((window as any).Stripe(STRIPE_PUBLIC_KEY));
    } else {
      // Add Stripe.js if it's not loaded yet
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => {
        resolve((window as any).Stripe(STRIPE_PUBLIC_KEY));
      };
      script.onerror = (err) => {
        reject(new Error('Failed to load Stripe.js'));
      };
      document.body.appendChild(script);
    }
  });
};

// Create a payment intent via Supabase Edge Function
export const createPaymentIntent = async (
  sessionId: string,
  amount: number,
  tutorId: string,
  studentId: string,
  description: string
): Promise<StripePaymentIntent> => {
  try {
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: {
        sessionId,
        amount,
        tutorId,
        studentId,
        description
      }
    });

    if (error) throw error;
    if (!data) throw new Error('No data returned from create-payment-intent function');
    
    return data as StripePaymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

// Process a payment with Stripe
export const processPayment = async (
  clientSecret: string,
  cardElement: any,
  name: string,
  email: string
) => {
  try {
    const stripe = await initializeStripe();
    
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name,
          email
        }
      }
    });
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    return result.paymentIntent;
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};
