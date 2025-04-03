
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the Stripe publishable key from environment variables
    const publishableKey = Deno.env.get('STRIPE_PUBLISHABLE_KEY');
    
    if (!publishableKey) {
      console.error("STRIPE_PUBLISHABLE_KEY is not set in environment variables");
      return new Response(
        JSON.stringify({ 
          error: 'Stripe publishable key not configured',
          code: 'stripe_config_missing'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    // Return the publishable key
    return new Response(
      JSON.stringify({ publishableKey }),
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
