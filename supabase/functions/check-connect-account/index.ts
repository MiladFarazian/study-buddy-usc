
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';
import Stripe from 'https://esm.sh/stripe@12.13.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("Check Connect Account function invoked");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log("Authorization header present, initializing Supabase client");
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables");
      return new Response(JSON.stringify({ 
        error: 'Server configuration error', 
        details: 'Missing Supabase credentials' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    console.log("Getting user from auth token");
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error("Invalid token or user not found:", userError);
      return new Response(JSON.stringify({ error: 'Invalid token', details: userError }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`User authenticated: ${user.id}`);

    // Get user profile
    console.log("Fetching user profile");
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return new Response(JSON.stringify({ error: 'Profile not found', details: profileError }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!profile) {
      console.error("Profile not found for user:", user.id);
      return new Response(JSON.stringify({ error: 'Profile not found for this user' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Profile retrieved, role: ${profile.role}`);

    // Check if user is a tutor
    if (profile.role !== 'tutor') {
      console.error("User is not a tutor, role:", profile.role);
      return new Response(JSON.stringify({ error: 'User is not a tutor' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log("Checking if tutor has a Stripe Connect account");
    
    // Check if tutor has a Stripe Connect account
    if (!profile.stripe_connect_id) {
      console.log("No Stripe Connect account found for tutor");
      return new Response(JSON.stringify({ 
        has_account: false,
        needs_onboarding: true,
        payouts_enabled: false
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Stripe Connect ID found: ${profile.stripe_connect_id}`);
    console.log("Checking Stripe Connect account status");
    
    // Check the status of the Stripe Connect account
    const stripeKey = Deno.env.get('STRIPE_CONNECT_SECRET_KEY');
    if (!stripeKey) {
      console.error("Missing Stripe Connect secret key");
      return new Response(JSON.stringify({ 
        error: 'Server configuration error', 
        details: 'Missing Stripe credentials' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    try {
      console.log(`Retrieving Stripe account: ${profile.stripe_connect_id}`);
      const account = await stripe.accounts.retrieve(profile.stripe_connect_id);
      console.log("Account retrieved:", {
        details_submitted: account.details_submitted,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled
      });
      
      const onboardingComplete = account.details_submitted && account.payouts_enabled;
      
      // Update onboarding status in the profile if needed
      if (onboardingComplete !== profile.stripe_connect_onboarding_complete) {
        console.log(`Updating onboarding status from ${profile.stripe_connect_onboarding_complete} to ${onboardingComplete}`);
        await supabaseAdmin
          .from('profiles')
          .update({
            stripe_connect_onboarding_complete: onboardingComplete,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
      }

      return new Response(JSON.stringify({
        has_account: true,
        account_id: profile.stripe_connect_id,
        details_submitted: account.details_submitted,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        needs_onboarding: !onboardingComplete,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (stripeError) {
      console.error("Error retrieving Stripe account:", stripeError);
      
      // If the account doesn't exist or was deleted
      if (stripeError.code === 'resource_missing') {
        console.log("Stripe account no longer exists, resetting profile");
        // Reset the Connect ID in the profile
        await supabaseAdmin
          .from('profiles')
          .update({
            stripe_connect_id: null,
            stripe_connect_onboarding_complete: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
          
        return new Response(JSON.stringify({ 
          has_account: false,
          needs_onboarding: true,
          error: 'Previous account no longer exists'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // For other Stripe errors
      return new Response(JSON.stringify({ 
        error: 'Error retrieving Stripe account', 
        details: stripeError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Unexpected error in check-connect-account:', error);
    return new Response(JSON.stringify({ 
      error: 'Unexpected error checking Connect account',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
