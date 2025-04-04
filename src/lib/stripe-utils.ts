
import { supabase } from "@/integrations/supabase/client";

// Cache for Stripe instance
let stripePromise: Promise<any> | null = null;
// Track loading state
let isLoadingStripe = false;
// Track failure count
let stripeLoadFailureCount = 0;
// Last error message
let lastStripeLoadError: string | null = null;
// Detected environment
let stripeEnvironment: string | null = null;
// Exponential backoff for retries
let lastStripeApiCallTime = 0;
const MIN_API_CALL_INTERVAL = 1000; // 1 second between API calls to prevent rate limiting

// Initialize Stripe
export const initializeStripe = () => {
  if (stripePromise) {
    return stripePromise;
  }
  
  if (isLoadingStripe) {
    // Return a promise that resolves when the current loading is done
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (!isLoadingStripe) {
          clearInterval(checkInterval);
          if (stripePromise) {
            resolve(stripePromise);
          } else {
            reject(new Error(lastStripeLoadError || 'Stripe initialization failed'));
          }
        }
      }, 100);
    });
  }
  
  console.log("Initializing Stripe");
  isLoadingStripe = true;
  
  stripePromise = new Promise<any>(async (resolve, reject) => {
    try {
      // Fetch the publishable key from the Edge Function
      const { data: configData, error: configError } = await supabase.functions.invoke('get-stripe-config', {
        body: {}
      });
      
      if (configError) {
        console.error("Failed to fetch Stripe configuration:", configError);
        lastStripeLoadError = `Failed to fetch Stripe configuration: ${configError.message}`;
        isLoadingStripe = false;
        reject(new Error(lastStripeLoadError));
        return;
      }
      
      if (!configData?.publishableKey) {
        console.error("No publishable key returned from get-stripe-config");
        lastStripeLoadError = 'No Stripe publishable key returned from server';
        isLoadingStripe = false;
        reject(new Error(lastStripeLoadError));
        return;
      }
      
      const publishableKey = configData.publishableKey;
      stripeEnvironment = configData.environment || 'test';
      console.log(`Got Stripe publishable key from backend (${stripeEnvironment} mode)`);
      
      if ((window as any).Stripe) {
        console.log(`Stripe already loaded, creating instance (${stripeEnvironment} mode)`);
        isLoadingStripe = false;
        resolve((window as any).Stripe(publishableKey));
      } else {
        console.log("Stripe not loaded, adding script");
        // Add Stripe.js if it's not loaded yet
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.async = true; // Add async loading
        script.onload = () => {
          console.log(`Stripe script loaded successfully (${stripeEnvironment} mode)`);
          isLoadingStripe = false;
          stripeLoadFailureCount = 0;
          lastStripeLoadError = null;
          resolve((window as any).Stripe(publishableKey));
        };
        script.onerror = (err) => {
          console.error("Failed to load Stripe.js", err);
          isLoadingStripe = false;
          stripeLoadFailureCount++;
          stripePromise = null;
          lastStripeLoadError = 'Failed to load Stripe.js script';
          reject(new Error(lastStripeLoadError));
        };
        document.body.appendChild(script);
      }
    } catch (err: any) {
      console.error("Error initializing Stripe:", err);
      isLoadingStripe = false;
      stripePromise = null;
      lastStripeLoadError = err.message || 'Unknown error initializing Stripe';
      reject(err);
    }
  }).catch(err => {
    console.error("Stripe initialization failed:", err);
    isLoadingStripe = false;
    stripePromise = null;
    throw err;
  });
  
  return stripePromise;
};

// Get the current Stripe environment
export const getStripeEnvironment = (): string => {
  return stripeEnvironment || 'test';
};

// Check if we're in production mode
export const isProductionMode = (): boolean => {
  return stripeEnvironment === 'production';
};

export interface StripePaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  two_stage_payment?: boolean;
}

// Implement a simple rate-limiting guard
const rateLimitGuard = async (): Promise<void> => {
  const now = Date.now();
  const timeSinceLastCall = now - lastStripeApiCallTime;
  
  if (timeSinceLastCall < MIN_API_CALL_INTERVAL) {
    // Wait for the remaining time
    const waitTime = MIN_API_CALL_INTERVAL - timeSinceLastCall;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastStripeApiCallTime = Date.now();
};

// Find existing payment intent for session
export const findExistingPaymentIntent = async (sessionId: string): Promise<StripePaymentIntent | null> => {
  try {
    await rateLimitGuard();
    console.log("Checking for existing payment intent for session:", sessionId);
    
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('stripe_payment_intent_id, amount, status')
      .eq('session_id', sessionId)
      .eq('status', 'pending')
      .maybeSingle();
    
    if (error) {
      console.error("Error checking for existing payment intent:", error);
      return null;
    }
    
    if (data?.stripe_payment_intent_id) {
      console.log("Found existing payment intent:", data.stripe_payment_intent_id);
      
      // Retrieve the full payment intent details
      const response = await supabase.functions.invoke('retrieve-payment-intent', {
        body: { paymentIntentId: data.stripe_payment_intent_id }
      });
      
      if (response.error) {
        console.error("Error retrieving payment intent:", response.error);
        return null;
      }
      
      if (response.data && response.data.client_secret) {
        return {
          id: data.stripe_payment_intent_id,
          client_secret: response.data.client_secret,
          amount: data.amount
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error finding existing payment intent:", error);
    return null;
  }
};

// Create a payment intent via Supabase Edge Function
export const createPaymentIntent = async (
  sessionId: string,
  amount: number,
  tutorId: string,
  studentId: string,
  description: string,
  forceTwoStage: boolean = false
): Promise<StripePaymentIntent> => {
  try {
    await rateLimitGuard();
    console.log("Creating payment intent:", { sessionId, amount, tutorId, studentId, description, forceTwoStage });
    
    // First check if there's an existing payment intent for this session
    const existingIntent = await findExistingPaymentIntent(sessionId);
    if (existingIntent) {
      console.log("Using existing payment intent:", existingIntent.id);
      return existingIntent;
    }
    
    // Ensure amount is a number and valid
    const amountInDollars = parseFloat(amount.toString());
    
    if (isNaN(amountInDollars) || amountInDollars <= 0) {
      throw new Error("Invalid amount: must be a positive number");
    }
    
    const payload = {
      sessionId,
      amount: amountInDollars, // Send as a number
      tutorId,
      studentId,
      description,
      forceTwoStage // Add this parameter to force two-stage payment if needed
    };
    
    // Add production flag if in production mode
    const headers: Record<string, string> = {};
    if (isProductionMode()) {
      headers['x-use-production'] = 'true';
    }
    
    console.log("Sending payment intent request with payload:", payload);
    
    // Add backoff retry logic
    let retries = 0;
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second
    
    while (retries <= maxRetries) {
      try {
        const { data, error } = await supabase.functions.invoke('create-payment-intent', {
          body: payload,
          headers
        });

        if (error) {
          throw error;
        }
        
        if (!data) {
          throw new Error('No data returned from create-payment-intent function');
        }
        
        // Check if the response contains an error with rate limiting
        if (data.error && data.code === 'rate_limited') {
          throw new Error(`Rate limited: ${data.error}`);
        }
        
        // Check if the response contains any other error message from the edge function
        if (data.error) {
          throw new Error(data.error.message || data.error);
        }
        
        console.log("Payment intent created successfully:", data);
        return data as StripePaymentIntent;
      } catch (error: any) {
        // Format and check error type
        const errorMessage = error.message || 'Unknown error';
        
        // Check if we should retry based on error type
        const isRateLimit = errorMessage.includes("rate limit") || 
                           errorMessage.includes("Rate limit") ||
                           errorMessage.includes("Too many requests");
        
        if (isRateLimit && retries < maxRetries) {
          retries++;
          const delay = baseDelay * Math.pow(2, retries);
          console.log(`Rate limit hit. Retrying in ${delay}ms (attempt ${retries}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Check if the error indicates missing Stripe Connect setup
        if (errorMessage.includes("payment account") || 
            errorMessage.includes("Stripe Connect") ||
            errorMessage.includes("not completed") ||
            errorMessage.includes("Stripe API error")) {
          console.error('Tutor Stripe Connect setup error:', errorMessage);
          throw new Error("The tutor's payment account setup is incomplete. Please check tutor settings or try another tutor.");
        }
        
        console.error('Error creating payment intent:', error);
        throw error;
      }
    }
    
    throw new Error('Maximum retry attempts exceeded');
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
