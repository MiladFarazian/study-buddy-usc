
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';
import Stripe from 'https://esm.sh/stripe@12.13.0?target=deno';
import { RateLimiter } from './rate-limiter.ts';
import { determineEnvironment } from './environment.ts';
import { validateRequest } from './validation.ts';
import { createPaymentIntent } from './payment-intent.ts';
import { errorHandlers } from './error-handlers.ts';
import { corsHeaders } from './cors-headers.ts';

// Central request handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log all requests to help with debugging
    console.log(`Request received: ${req.method} with headers: ${JSON.stringify([...req.headers])}`);
    
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
    
    // Determine environment (production vs test)
    const { isProduction, stripeSecretKey, environmentDecision } = 
      await determineEnvironment(req, requestBody);
    
    if (!stripeSecretKey) {
      console.error(`Missing ${isProduction ? 'STRIPE_CONNECT_LIVE_SECRET_KEY' : 'STRIPE_CONNECT_SECRET_KEY'} environment variable`);
      return new Response(
        JSON.stringify({ 
          error: `Stripe configuration missing`,
          code: 'stripe_config_missing',
          environment: isProduction ? 'production' : 'test'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
    
    console.log(`Final environment decision: ${environmentDecision}`);

    // Extract request parameters
    const { sessionId, amount, tutorId, studentId, description, forceTwoStage } = requestBody;
    console.log(`Request params: sessionId=${sessionId}, amount=${amount}, forceTwoStage=${forceTwoStage}`);
    
    // Apply rate limiting
    const rateLimiter = new RateLimiter();
    const rateLimitResult = rateLimiter.checkRateLimit(req, sessionId, studentId);
    
    if (rateLimitResult.isLimited) {
      console.log(`Rate limit exceeded for ${rateLimitResult.requestKey} (count: ${rateLimitResult.count})`);
      return new Response(
        JSON.stringify({ 
          error: 'Too many payment requests. Please try again later.',
          code: 'rate_limited',
          retryAfter: rateLimitResult.retryAfter
        }), 
        {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': rateLimitResult.retryAfter.toString()
          },
          status: 429,
        }
      );
    }

    // Validate required parameters
    const validationResult = validateRequest(sessionId, amount, tutorId, studentId);
    if (!validationResult.isValid) {
      return new Response(
        JSON.stringify({ 
          error: validationResult.error,
          code: validationResult.code
        }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

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

    // Create payment intent
    try {
      const result = await createPaymentIntent(
        supabaseAdmin,
        stripeSecretKey,
        sessionId,
        amount,
        tutorId,
        studentId,
        description,
        forceTwoStage,
        isProduction
      );
      
      // Return the client secret to the client
      return new Response(
        JSON.stringify(result),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (error) {
      return errorHandlers.handleStripeError(error, corsHeaders);
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
