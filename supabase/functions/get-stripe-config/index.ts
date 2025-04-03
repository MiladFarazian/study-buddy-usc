
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to determine if we're in production
const isProduction = () => {
  // Check for production hostname
  const hostname = Deno.env.get('HOSTNAME') || '';
  const isDeploy = hostname.includes('studybuddyusc.com') || hostname.includes('prod');
  
  // Override for explicit environment variable
  const envFlag = Deno.env.get('USE_PRODUCTION_STRIPE');
  if (envFlag === 'true') return true;
  if (envFlag === 'false') return false;
  
  return isDeploy;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Determine which key to use based on environment
    const environment = isProduction() ? 'production' : 'test';
    console.log(`Using Stripe ${environment} mode`);
    
    // Get the appropriate Stripe publishable key from environment variables
    const publishableKey = isProduction() 
      ? Deno.env.get('STRIPE_LIVE_PUBLISHABLE_KEY') 
      : Deno.env.get('STRIPE_PUBLISHABLE_KEY');
    
    if (!publishableKey) {
      console.error(`STRIPE_${isProduction() ? 'LIVE_' : ''}PUBLISHABLE_KEY is not set in environment variables`);
      return new Response(
        JSON.stringify({ 
          error: 'Stripe publishable key not configured',
          code: 'stripe_config_missing',
          environment
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    // Return the publishable key and environment info
    return new Response(
      JSON.stringify({ 
        publishableKey,
        environment 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error in get-stripe-config:", error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to retrieve Stripe configuration',
        code: 'server_error',
        details: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
