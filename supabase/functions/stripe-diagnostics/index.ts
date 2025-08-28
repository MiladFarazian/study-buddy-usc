import { serve } from "https://deno.land/std@0.177.1/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { determineEnvironment } from "../create-payment-intent/environment.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('Stripe diagnostics request received');
    
    // Use same environment detection logic as create-payment-intent
    const { isProduction, stripeSecretKey } = await determineEnvironment(req, {});
    
    if (!stripeSecretKey) {
      console.error('No Stripe secret key found');
      return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
    
    // Get account information
    const account = await stripe.accounts.retrieve();
    console.log(`Retrieved Stripe account: ${account.id}`);
    
    // Get publishable key (same logic as get-stripe-config)
    const publishableKey = isProduction 
      ? Deno.env.get('STRIPE_LIVE_PUBLISHABLE_KEY')
      : Deno.env.get('STRIPE_PUBLISHABLE_KEY');
      
    if (!publishableKey) {
      console.error('No publishable key found');
      return new Response(JSON.stringify({ error: 'Publishable key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mask publishable key: pk_test_abc123xyz9 → pk_test_****yz9
    const maskKey = (key: string) => {
      if (!key || key.length < 8) return key;
      const prefix = key.substring(0, key.indexOf('_') + 1);
      const suffix = key.slice(-4);
      return `${prefix}****${suffix}`;
    };
    
    const maskedPublishableKey = maskKey(publishableKey);
    const last4 = publishableKey.slice(-4);
    
    // Optional: echo frontend key if provided
    const url = new URL(req.url);
    const frontendKey = url.searchParams.get('frontend_key');
    const frontendKeyMasked = frontendKey ? maskKey(frontendKey) : undefined;

    const response = {
      server_account_id: account.id,
      server_secret_mode: isProduction ? 'live' as const : 'test' as const,
      server_publishable_key_masked: maskedPublishableKey,
      expected_publishable_key_last4: last4,
      ...(frontendKeyMasked && { frontend_publishable_key_masked: frontendKeyMasked })
    };

    console.log('Returning diagnostics:', { 
      account_id: account.id, 
      mode: response.server_secret_mode,
      masked_key: maskedPublishableKey
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Stripe diagnostics error:', error);
    return new Response(JSON.stringify({ 
      error: 'Diagnostics failed',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});