
import { supabase } from "@/integrations/supabase/client";

const STRIPE_PUBLIC_KEY = "pk_test_51R9DpIPF6HhVb1F0M00AK1877aQa1pSH7nujC3bCrbd058tuM7fLrJn3CFVAA0fDPy7xYpsdq7ZjZvh3xME4UJnF000NPpVfds";

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
    console.log("Initializing Stripe with public key:", STRIPE_PUBLIC_KEY);
    stripePromise = new Promise<any>((resolve, reject) => {
      if ((window as any).Stripe) {
        console.log("Stripe already loaded, creating instance");
        resolve((window as any).Stripe(STRIPE_PUBLIC_KEY));
      } else {
        console.log("Stripe not loaded, adding script");
        // Add Stripe.js if it's not loaded yet
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.onload = () => {
          console.log("Stripe script loaded successfully");
          resolve((window as any).Stripe(STRIPE_PUBLIC_KEY));
        };
        script.onerror = (err) => {
          console.error("Failed to load Stripe.js", err);
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
    const amountInDollars = parseFloat(amount.toString());
    
    if (isNaN(amountInDollars) || amountInDollars <= 0) {
      throw new Error("Invalid amount: must be a positive number");
    }
    
    const payload = {
      sessionId,
      amount: amountInDollars, // Send as a number
      tutorId,
      studentId,
      description
    };
    
    console.log("Sending payment intent request with payload:", payload);
    
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
    
    console.log("Payment intent created successfully:", data);
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
