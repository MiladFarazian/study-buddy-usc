
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';
import Stripe from 'https://esm.sh/stripe@12.13.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple rate limiting mechanism
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
const RATE_LIMIT_MAX = 10; // Maximum allowed requests per minute
const requestLog: Record<string, { count: number, timestamp: number }> = {};

// Check if a request should be rate limited
function shouldRateLimit(clientId: string): boolean {
  const now = Date.now();
  const clientRequests = requestLog[clientId];
  
  if (!clientRequests) {
    requestLog[clientId] = { count: 1, timestamp: now };
    return false;
  }
  
  // If the time window has passed, reset the counter
  if (now - clientRequests.timestamp > RATE_LIMIT_WINDOW) {
    requestLog[clientId] = { count: 1, timestamp: now };
    return false;
  }
  
  // Increment the counter
  clientRequests.count++;
  
  // Return true if the limit is exceeded
  return clientRequests.count > RATE_LIMIT_MAX;
}

// Clean up old entries in the request log periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(requestLog).forEach(key => {
    if (now - requestLog[key].timestamp > RATE_LIMIT_WINDOW) {
      delete requestLog[key];
    }
  });
}, RATE_LIMIT_WINDOW);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if Stripe secret key is configured
    const stripeSecretKey = Deno.env.get('STRIPE_CONNECT_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('Missing STRIPE_CONNECT_SECRET_KEY environment variable');
      return new Response(
        JSON.stringify({ 
          error: 'Stripe configuration missing. Please set the STRIPE_CONNECT_SECRET_KEY in Supabase edge function secrets.' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid request body format' }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const { sessionId, amount, tutorId, studentId, description } = requestBody;
    
    // Client identifier for rate limiting - using session ID
    const clientId = sessionId || 'anonymous';
    
    // Implement rate limiting
    if (shouldRateLimit(clientId)) {
      return new Response(
        JSON.stringify({ 
          error: 'Too many payment requests. Please try again in a moment.',
          code: 'rate_limited'
        }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429,
        }
      );
    }

    // Validate required parameters
    if (!sessionId || amount === undefined || !tutorId || !studentId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log(`Creating payment intent for session ${sessionId} with amount ${amount}`);

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Check if a payment transaction already exists for this session
    const { data: existingTransaction, error: txCheckError } = await supabaseAdmin
      .from('payment_transactions')
      .select('id, stripe_payment_intent_id, status')
      .eq('session_id', sessionId)
      .eq('status', 'pending')
      .or('status.eq.processing')
      .maybeSingle();
    
    if (txCheckError) {
      console.error('Error checking for existing transactions:', txCheckError);
    }
    
    // If there's an existing transaction with a valid payment intent, return it
    if (existingTransaction?.stripe_payment_intent_id) {
      console.log(`Found existing payment intent: ${existingTransaction.stripe_payment_intent_id}`);
      
      try {
        // Initialize Stripe
        const stripe = new Stripe(stripeSecretKey, {
          apiVersion: '2023-10-16',
        });
        
        // Retrieve the existing payment intent
        const paymentIntent = await stripe.paymentIntents.retrieve(
          existingTransaction.stripe_payment_intent_id
        );
        
        // Only return if it's in a usable state
        if (['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(paymentIntent.status)) {
          return new Response(
            JSON.stringify({
              id: paymentIntent.id,
              client_secret: paymentIntent.client_secret,
              amount: amount,
              payment_transaction_id: existingTransaction.id,
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          );
        }
      } catch (retrieveError) {
        console.error('Error retrieving existing payment intent:', retrieveError);
        // Continue to create a new one if there was an error
      }
    }

    // Get the tutor's Stripe Connect ID
    const { data: tutorProfile, error: tutorError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_connect_id, stripe_connect_onboarding_complete')
      .eq('id', tutorId)
      .single();

    if (tutorError || !tutorProfile) {
      return new Response(
        JSON.stringify({ error: 'Tutor profile not found' }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }

    if (!tutorProfile.stripe_connect_id) {
      return new Response(
        JSON.stringify({ error: 'Tutor has not set up their payment account yet' }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    if (!tutorProfile.stripe_connect_onboarding_complete) {
      return new Response(
        JSON.stringify({ error: 'Tutor has not completed their payment account setup' }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Initialize Stripe
    try {
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
      });

      // Ensure amount is a number and convert to cents (Stripe uses smallest currency unit)
      const amountInCents = Math.round(parseFloat(amount.toString()) * 100);
      
      if (isNaN(amountInCents) || amountInCents <= 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid amount value' }), 
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }
      
      console.log('Creating new payment intent with amount:', amount);
      
      // Calculate platform fee (10% of the amount)
      const platformFeeAmount = Math.round(amountInCents * 0.1);
      
      // Create a new payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        capture_method: 'manual', // This allows us to authorize now but capture later
        metadata: {
          sessionId,
          tutorId,
          studentId,
          platformFee: platformFeeAmount,
        },
        description: description || `Tutoring session payment`,
        application_fee_amount: platformFeeAmount,
        transfer_data: {
          destination: tutorProfile.stripe_connect_id,
        },
      });
      
      console.log(`Created new payment intent: ${paymentIntent.id}`);

      // Create a payment transaction record in the database
      const { data: paymentTransaction, error: paymentError } = await supabaseAdmin
        .from('payment_transactions')
        .insert({
          session_id: sessionId,
          student_id: studentId,
          tutor_id: tutorId,
          amount: parseFloat(amount.toString()),
          status: 'pending',
          stripe_payment_intent_id: paymentIntent.id,
          payment_intent_status: paymentIntent.status,
          capture_method: 'manual',
          platform_fee: platformFeeAmount / 100,
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Error creating payment transaction:', paymentError);
      }
      
      // Return the client secret to the client
      return new Response(
        JSON.stringify({
          id: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
          amount: amount, // Keep original amount for display
          payment_transaction_id: paymentTransaction?.id,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (stripeError) {
      console.error('Stripe API error:', stripeError);
      
      // Handle rate limiting errors specially
      if (stripeError.code === 'rate_limit') {
        return new Response(
          JSON.stringify({ 
            error: 'Stripe rate limit exceeded. Please try again in a moment.',
            code: 'rate_limited',
            details: stripeError.message
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 429,
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Stripe API error. Please check your Stripe configuration and try again.',
          details: stripeError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create payment intent' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
