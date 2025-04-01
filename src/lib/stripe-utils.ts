
import { supabase } from "@/integrations/supabase/client";

const STRIPE_PUBLIC_KEY = "pk_test_51Ok0zXRnDQljLWdZVYc5mUPORgYEO64gQUe2HH5YqtdrmDZPXI9p4RR0yiiwI7YPVXcqLcSjn7Pp4RLY2PVWxdZv00URQjH9Cg";

export interface StripePaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
}

// Cache for Stripe instance
let stripePromise: Promise<any> | null = null;

// Initialize Stripe
export const initializeStripe = () => {
  if (!stripePromise) {
    stripePromise = new Promise<any>((resolve, reject) => {
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
  }
  return stripePromise;
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
    console.log("Creating payment intent:", { sessionId, amount, tutorId, studentId, description });
    
    // Prepare the request body - ensure amount is a number
    const payload = {
      sessionId,
      amount: parseFloat(amount.toString()), // Ensure amount is a number
      tutorId,
      studentId,
      description
    };
    
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: payload
    });

    if (error) {
      console.error("Supabase function error:", error);
      throw error;
    }
    
    if (!data) {
      console.error("No data returned from create-payment-intent function");
      throw new Error('No data returned from create-payment-intent function');
    }
    
    // Check if the response contains an error message from the edge function
    if (data.error) {
      console.error("Edge function error:", data.error);
      throw new Error(data.error.message || data.error);
    }
    
    console.log("Payment intent created:", data);
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
    
    console.log("Processing payment for:", { name, email });
    
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
      console.error("Stripe payment error:", result.error);
      throw new Error(result.error.message);
    }
    
    console.log("Payment successful:", result.paymentIntent);
    return result.paymentIntent;
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};
