// Simple Stripe client initialization for Payment Links
import { loadStripe } from "@stripe/stripe-js";

let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NODE_ENV === 'production' 
        ? 'pk_live_...' // Replace with actual live key
        : 'pk_test_51Q9x7SPF6HhVb1F0KXYOkAGsw8P2FjUKBqQGgLfSW9pDPF5v0qhKTJgEpFH4DklZXaY7cRjgAGj4Y1R9fChjNrP200yHvOgJmz' // Test key
    );
  }
  return stripePromise;
};

// Note: Payment Links don't require client-side Stripe initialization
// This file is kept for compatibility with existing components
export default getStripe;