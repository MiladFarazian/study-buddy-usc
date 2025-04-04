import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';
import Stripe from 'https://esm.sh/stripe@12.13.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Improved rate limiting with distributed state
// Using session IDs as keys to track request counts more accurately
const RATE_LIMIT_WINDOW = 60000; // 1 minute window
const RATE_LIMIT_MAX = 10; // Increased max requests per session to prevent legitimate retries from failing
const requestLog: Record<string, { count: number, timestamp: number }> = {};

// Periodically clean up old entries (every 5 minutes)
const CLEANUP_INTERVAL = 300000; // 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const key in requestLog) {
    if (now - requestLog[key].timestamp > RATE_LIMIT_WINDOW * 2) {
      delete requestLog[key];
    }
  }
}, CLEANUP_INTERVAL);

// More granular rate limiting function
function shouldRateLimit(clientId: string): boolean {
  const now = Date.now();
  const clientRequests = requestLog[clientId];
  
  if (!clientRequests) {
    requestLog[clientId] = { count: 1, timestamp: now };
    return false;
  }
  
  // Reset counter if window has passed
  if (now - clientRequests.timestamp > RATE_LIMIT_WINDOW) {
    requestLog[clientId] = { count: 1, timestamp: now };
    return false;
  }
  
  // Increment request counter
  clientRequests.count++;
  clientRequests.timestamp = now; // Update timestamp to keep track of latest activity
  
  return clientRequests.count > RATE_LIMIT_MAX;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Determine which Stripe secret key to use based on environment
    const isProduction = req.headers.get('x-use-production') === 'true';
    
    // Check if Stripe secret key is configured
    const stripeSecretKey = isProduction 
      ? Deno.env.get('STRIPE_CONNECT_LIVE_SECRET_KEY')
      : Deno.env.get('STRIPE_CONNECT_SECRET_KEY');
      
    if (!stripeSecretKey) {
      console.error(`Missing ${isProduction ? 'STRIPE_CONNECT_LIVE_SECRET_KEY' : 'STRIPE_CONNECT_SECRET_KEY'} environment variable`);
      return new Response(
        JSON.stringify({ 
          error: `Stripe configuration missing`,
          code: 'stripe_config_missing'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Parse request body with better error handling
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

    const { sessionId, amount, tutorId, studentId, description, forceTwoStage } = requestBody;
    
    // Use a more unique rate limit key that combines sessionId, tutorId, and a timestamp segment
    // This helps prevent conflicts between different booking attempts for the same session
    const timeSegment = Math.floor(Date.now() / 10000); // 10 second segments
    const clientId = `${sessionId}_${tutorId}_${timeSegment}`;
    
    // Implement rate limiting with better logging
    if (shouldRateLimit(clientId)) {
      console.log(`Rate limit exceeded for session ${sessionId} within time segment ${timeSegment}`);
      return new Response(
        JSON.stringify({ 
          error: 'Too many payment requests. Please try again in a moment.',
          code: 'rate_limited'
        }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429, // Use proper 429 Too Many Requests status code
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

    console.log(`Creating payment intent for session ${sessionId} with amount ${amount} (${isProduction ? 'production' : 'test'} mode)`);

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
        } else {
          console.log(`Existing payment intent ${paymentIntent.id} has status ${paymentIntent.status}, creating new one`);
        }
      } catch (retrieveError) {
        console.error('Error retrieving existing payment intent:', retrieveError);
        // Continue to create a new one if there was an error
      }
    }

    // Get the tutor's Stripe Connect ID
    const connectIdField = isProduction ? 'stripe_connect_live_id' : 'stripe_connect_id';
    const onboardingCompleteField = isProduction ? 'stripe_connect_live_onboarding_complete' : 'stripe_connect_onboarding_complete';
    
    const { data: tutorProfile, error: tutorError } = await supabaseAdmin
      .from('profiles')
      .select(`${connectIdField}, ${onboardingCompleteField}, first_name, last_name`)
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
      
    console.log(`Processing for tutor: ${tutorName}, Connect ID: ${tutorProfile[connectIdField] || 'not set up'}`);

    const hasCompleteConnectAccount = tutorProfile[connectIdField] && tutorProfile[onboardingCompleteField];
    
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
      // If tutor has completed onboarding and we're not forcing two-stage, create with Connect parameters
      // Otherwise, create a regular payment intent to the platform
      let paymentIntent;
      let isTwoStagePayment = false;
      
      if (hasCompleteConnectAccount && !forceTwoStage) {
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
            paymentType: 'connect_direct',
            environment: isProduction ? 'production' : 'test'
          },
          description: description || `Tutoring session payment for ${tutorName}`,
          application_fee_amount: platformFeeAmount, // Platform fee (10%)
          transfer_data: {
            destination: tutorProfile[connectIdField], // Tutor's Connect account
          },
          transfer_group: transferGroup, // Used to track related transfers
          on_behalf_of: tutorProfile[connectIdField], // Show in the connected account's dashboard too
        });
        
        console.log(`Created Connect payment intent: ${paymentIntent.id} with transfer to: ${tutorProfile[connectIdField]}`);
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
            requiresTransfer: 'true',
            environment: isProduction ? 'production' : 'test'
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
          two_stage_payment: isTwoStagePayment,
          environment: isProduction ? 'production' : 'test'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (stripeError: any) {
      console.error('Stripe API error:', stripeError);
      
      // Handle rate limiting errors specifically
      if (stripeError.code === 'rate_limit') {
        return new Response(
          JSON.stringify({
            error: 'Stripe API rate limit exceeded. Please try again in a moment.',
            code: 'rate_limited',
            details: stripeError.message
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 429,
          }
        );
      }
      
      // Handle other Stripe-specific errors
      if (stripeError.type === 'StripeCardError') {
        return new Response(
          JSON.stringify({
            error: stripeError.message,
            code: stripeError.code,
            decline_code: stripeError.decline_code
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }
      
      // Generic error handling
      return new Response(
        JSON.stringify({
          error: stripeError.message || 'An error occurred while processing the payment',
          code: stripeError.code || 'unknown_error'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
  } catch (error: any) {
    console.error('Unexpected error in payment intent creation:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
        code: 'server_error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
