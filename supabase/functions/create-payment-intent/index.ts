
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
// Note: Using a timeout instead of setInterval to avoid Deno.core.runMicrotasks issues
function scheduleCleanup() {
  setTimeout(() => {
    try {
      const now = Date.now();
      Object.keys(requestLog).forEach(key => {
        if (now - requestLog[key].timestamp > RATE_LIMIT_WINDOW) {
          delete requestLog[key];
        }
      });
      scheduleCleanup();
    } catch (err) {
      console.error("Error in cleanup task:", err);
      scheduleCleanup();
    }
  }, RATE_LIMIT_WINDOW);
}

// Start the cleanup schedule
scheduleCleanup();

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
          error: 'Stripe configuration missing. Please set the STRIPE_CONNECT_SECRET_KEY in Supabase edge function secrets.',
          code: 'stripe_config_missing'
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
        JSON.stringify({ 
          error: 'Invalid request body format',
          code: 'invalid_request'
        }), 
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
        JSON.stringify({ 
          error: 'Missing required parameters',
          code: 'missing_parameters'
        }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log(`Creating payment intent for session ${sessionId} with amount ${amount}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Supabase configuration missing',
          code: 'supabase_config_missing'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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
      .select('stripe_connect_id, stripe_connect_onboarding_complete, first_name, last_name')
      .eq('id', tutorId)
      .single();

    if (tutorError || !tutorProfile) {
      console.error('Error fetching tutor profile:', tutorError);
      return new Response(
        JSON.stringify({ 
          error: 'Tutor profile not found',
          code: 'tutor_not_found'
        }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }

    const tutorName = tutorProfile.first_name && tutorProfile.last_name 
      ? `${tutorProfile.first_name} ${tutorProfile.last_name}`
      : 'Tutor';
      
    console.log(`Processing for tutor: ${tutorName}, Connect ID: ${tutorProfile.stripe_connect_id || 'not set up'}`);

    const hasCompleteConnectAccount = tutorProfile.stripe_connect_id && tutorProfile.stripe_connect_onboarding_complete;
    
    // Initialize Stripe
    try {
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
      });

      // Ensure amount is a number and convert to cents (Stripe uses smallest currency unit)
      const amountInCents = Math.round(parseFloat(amount.toString()) * 100);
      
      if (isNaN(amountInCents) || amountInCents <= 0) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid amount value',
            code: 'invalid_amount'
          }), 
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }
      
      console.log('Creating new payment intent with amount in cents:', amountInCents);
      
      // Calculate platform fee (10% of the amount)
      const platformFeeAmount = Math.round(amountInCents * 0.1);
      
      // Get transfer group ID based on session for tracking
      const transferGroup = `session_${sessionId}`;
      
      // Create a payment intent
      // If tutor has completed onboarding, create with Connect parameters
      // Otherwise, create a regular payment intent to the platform
      let paymentIntent;
      let isTwoStagePayment = false;
      
      if (hasCompleteConnectAccount) {
        // Create a standard Connect payment intent with immediate transfer
        paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: 'usd',
          capture_method: 'automatic',
          metadata: {
            sessionId,
            tutorId,
            studentId,
            platformFee: platformFeeAmount,
            tutorName,
            paymentType: 'connect_direct'
          },
          description: description || `Tutoring session payment for ${tutorName}`,
          application_fee_amount: platformFeeAmount, // Platform fee (10%)
          transfer_data: {
            destination: tutorProfile.stripe_connect_id, // Tutor's Connect account
          },
          transfer_group: transferGroup, // Used to track related transfers
          on_behalf_of: tutorProfile.stripe_connect_id, // Show in the connected account's dashboard too
        });
        
        console.log(`Created Connect payment intent: ${paymentIntent.id} with transfer to: ${tutorProfile.stripe_connect_id}`);
      } else {
        // Create a regular payment intent to the platform account
        // The funds will be transferred to the tutor later when they complete onboarding
        paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: 'usd',
          capture_method: 'automatic',
          metadata: {
            sessionId,
            tutorId,
            studentId,
            platformFee: platformFeeAmount,
            tutorName,
            paymentType: 'two_stage',
            requiresTransfer: 'true'
          },
          description: description || `Tutoring session payment for ${tutorName} (pending tutor onboarding)`,
          transfer_group: transferGroup, // Used to track related transfers
        });
        
        isTwoStagePayment = true;
        console.log(`Created two-stage payment intent: ${paymentIntent.id} for tutor: ${tutorId} pending onboarding`);
      }

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
          platform_fee: platformFeeAmount / 100,
          requires_transfer: isTwoStagePayment,
          payment_type: isTwoStagePayment ? 'two_stage' : 'connect_direct'
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Error creating payment transaction:', paymentError);
        // Continue anyway, since the payment intent was created
      } else {
        console.log(`Created payment transaction: ${paymentTransaction.id}`);
      }
      
      // If this is a two-stage payment, create a pending_transfers record
      if (isTwoStagePayment) {
        // Insert a record to track the pending transfer to the tutor once they onboard
        const tutorAmount = amountInCents - platformFeeAmount;
        
        const { error: transferError } = await supabaseAdmin
          .from('pending_transfers')
          .insert({
            payment_transaction_id: paymentTransaction?.id,
            session_id: sessionId,
            tutor_id: tutorId,
            student_id: studentId,
            amount: tutorAmount / 100, // Convert back to dollars
            platform_fee: platformFeeAmount / 100,
            status: 'pending',
            payment_intent_id: paymentIntent.id,
            transfer_group: transferGroup
          });
          
        if (transferError) {
          console.error('Error creating pending transfer record:', transferError);
        } else {
          console.log(`Created pending transfer record for tutor: ${tutorId}`);
        }
      }
      
      // Return the client secret to the client
      return new Response(
        JSON.stringify({
          id: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
          amount: amount, // Keep original amount for display
          payment_transaction_id: paymentTransaction?.id,
          two_stage_payment: isTwoStagePayment
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (stripeError: any) {
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
      
      // Handle account verification issues
      if (stripeError.code === 'account_invalid' || 
          stripeError.message?.includes('verification') ||
          stripeError.message?.includes('capability')) {
        return new Response(
          JSON.stringify({ 
            error: 'Tutor account requires verification. Please try a different tutor.',
            code: 'connect_verification_required',
            details: stripeError.message
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Stripe API error. Please check your Stripe configuration and try again.',
          code: 'stripe_api_error',
          details: stripeError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
  } catch (error: any) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create payment intent',
        code: 'server_error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
