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
// Better rate limit handling
let lastStripeApiCallTime = 0;
const MIN_API_CALL_INTERVAL = 2500; // 2.5 second between API calls to prevent rate limiting
const BACKOFF_MULTIPLIER = 2; // Exponential backoff multiplier for retries

// Debug mode log environment
console.log("Stripe-utils loaded - environment detection pending");

// Initialize Stripe with better error handling
export const initializeStripe = async () => {
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
        script.async = true;
        
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

// Implement a smarter rate-limiting guard with exponential backoff
const rateLimitGuard = async (retryCount: number = 0): Promise<void> => {
  const now = Date.now();
  const timeSinceLastCall = now - lastStripeApiCallTime;
  
  // Calculate delay with exponential backoff if retries are happening
  const minDelay = MIN_API_CALL_INTERVAL * Math.pow(BACKOFF_MULTIPLIER, retryCount);
  
  if (timeSinceLastCall < minDelay) {
    // Wait for the remaining time
    const waitTime = minDelay - timeSinceLastCall;
    console.log(`Rate limiting - waiting ${waitTime}ms before API call (retry #${retryCount})`);
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

// Create a payment intent via Supabase Edge Function with improved error handling and retries
export const createPaymentIntent = async (
  sessionId: string,
  amount: number,
  tutorId: string,
  studentId: string,
  description: string,
  forceTwoStage: boolean = false,
  isProduction: boolean = false
): Promise<StripePaymentIntent> => {
  console.log(`createPaymentIntent called with forceTwoStage=${forceTwoStage}, isProduction=${isProduction}`);
  
  // Maximum number of retries
  const maxRetries = 3;
  
  // Helper function for exponential backoff retry
  const executeWithRetry = async (attempt: number = 0): Promise<StripePaymentIntent> => {
    try {
      // Apply rate limiting with backoff based on attempt number
      await rateLimitGuard(attempt);
      
      console.log(`Creating payment intent (attempt ${attempt + 1}/${maxRetries + 1}):`, 
        { sessionId, amount, tutorId, studentId, description, forceTwoStage, isProduction });
      
      // Check for existing payment intent first
      if (attempt === 0) { // Only check on first attempt to avoid infinite loops
        const existingIntent = await findExistingPaymentIntent(sessionId);
        if (existingIntent) {
          console.log("Using existing payment intent:", existingIntent.id);
          return existingIntent;
        }
      }
      
      // Validate amount
      const amountInDollars = parseFloat(amount.toString());
      if (isNaN(amountInDollars) || amountInDollars <= 0) {
        throw new Error("Invalid amount: must be a positive number");
      }
      
      const payload = {
        sessionId,
        amount: amountInDollars,
        tutorId,
        studentId,
        description,
        forceTwoStage,
        isProduction // Add this to the payload
      };
      
      // Add production flag to headers explicitly
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (isProduction) {
        headers['x-use-production'] = 'true';
        console.log("Using production Stripe API keys - added header flag");
      }
      
      console.log("Sending payment intent request with payload:", JSON.stringify(payload));
      console.log("Headers:", JSON.stringify(headers));
      
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: payload,
        headers: headers
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(`Edge function error: ${error.message}`);
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
      console.error(`Payment intent error: ${errorMessage}`);
      
      // Check if we should retry based on error type
      const isRateLimit = errorMessage.includes("rate limit") || 
                         errorMessage.includes("Rate limit") ||
                         errorMessage.includes("Too many requests") ||
                         errorMessage.includes("429");
      
      const isNetworkError = errorMessage.includes("Failed to fetch") ||
                           errorMessage.includes("network") ||
                           errorMessage.includes("Network Error") ||
                           errorMessage.includes("Failed to send");
      
      const shouldRetry = (isRateLimit || isNetworkError) && attempt < maxRetries;
      
      if (shouldRetry) {
        const delay = MIN_API_CALL_INTERVAL * Math.pow(BACKOFF_MULTIPLIER, attempt);
        console.log(`API call failed with ${isRateLimit ? 'rate limit' : 'network'} error. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return executeWithRetry(attempt + 1);
      }
      
      // Check if the error indicates missing Stripe Connect setup
      if (errorMessage.includes("payment account") || 
          errorMessage.includes("Stripe Connect") ||
          errorMessage.includes("not completed") ||
          errorMessage.includes("not set up")) {
        console.error('Tutor Stripe Connect setup error:', errorMessage);
        
        // If this is the final attempt and we haven't forced two-stage payment yet, try with forceTwoStage=true
        if (attempt === maxRetries && !forceTwoStage) {
          console.log("Trying one last attempt with forceTwoStage=true");
          return createPaymentIntent(sessionId, amount, tutorId, studentId, description, true, isProduction);
        }
        
        throw new Error("The tutor's payment account setup is incomplete. Payment will be collected now and transferred to them later.");
      }
      
      console.error('Error creating payment intent:', error);
      throw error;
    }
  };
  
  // Start the retry process
  return executeWithRetry();
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
