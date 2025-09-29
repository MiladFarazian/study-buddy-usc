
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&bundle";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper functions for explicit Stripe mode selection
const getStripeMode = (): 'test' | 'live' => {
  const mode = (Deno.env.get('STRIPE_MODE') || '').toLowerCase();
  if (mode !== 'test' && mode !== 'live') {
    throw new Error('STRIPE_MODE must be "test" or "live"');
  }
  return mode as 'test' | 'live';
};

const getStripeKey = (mode: 'test' | 'live') => {
  const key = mode === 'live'
    ? Deno.env.get('STRIPE_CONNECT_LIVE_SECRET_KEY')
    : Deno.env.get('STRIPE_CONNECT_SECRET_KEY');

  if (!key) throw new Error(`Missing Stripe ${mode} secret key`);
  if (mode === 'live' && !key.startsWith('sk_live_')) {
    throw new Error('Live mode requires an sk_live_ key');
  }
  if (mode === 'test' && !key.startsWith('sk_test_')) {
    throw new Error('Test mode requires an sk_test_ key');
  }
  return key;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Determine environment explicitly
    const mode = getStripeMode(); // 'test' | 'live'
    console.log(`Retrieving payment intent in ${mode} mode`);
    
    // Get appropriate Stripe key using explicit mode selector
    const stripeSecretKey = getStripeKey(mode);
    console.log(`Stripe mode=${mode} keyPrefix=${stripeSecretKey.slice(0, 8)}`);
    
    if (!stripeSecretKey) {
      console.error(`Missing STRIPE_CONNECT_${mode.toUpperCase()}_SECRET_KEY environment variable`);
      return new Response(
        JSON.stringify({ 
          error: `Stripe configuration missing. Please set the STRIPE_CONNECT_${mode.toUpperCase()}_SECRET_KEY in Supabase edge function secrets.` 
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

    const { paymentIntentId } = requestBody;
    
    if (!paymentIntentId) {
      return new Response(
        JSON.stringify({ error: 'Missing payment intent ID' }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      timeout: 30000,
    });

    try {
      // Retrieve the payment intent
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      return new Response(
        JSON.stringify({
          id: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100, // Convert from cents to dollars
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (stripeError) {
      const strErr = stripeError as any;
      console.error('Stripe API error:', stripeError);
      
      // Handle rate limiting errors specially
      if (strErr.code === 'rate_limit') {
        return new Response(
          JSON.stringify({ 
            error: 'Stripe rate limit exceeded. Please try again in a moment.',
            code: 'rate_limited',
            details: strErr.message
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
          details: strErr.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
  } catch (error) {
    const err = error as any;
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to retrieve payment intent' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
