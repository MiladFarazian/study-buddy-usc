
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno&bundle';

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
  console.log("Create Connect Account function invoked");
  
  // === STRIPE_CONNECT_SECRET_KEY INVESTIGATION START ===
  console.log('🔍 CREATE_CONNECT_DEBUG: Environment variable analysis');
  console.log('STRIPE_CONNECT_SECRET_KEY exists:', !!Deno.env.get('STRIPE_CONNECT_SECRET_KEY'));
  console.log('STRIPE_CONNECT_SECRET_KEY length:', (Deno.env.get('STRIPE_CONNECT_SECRET_KEY') || '').length);
  console.log('STRIPE_CONNECT_LIVE_SECRET_KEY exists:', !!Deno.env.get('STRIPE_CONNECT_LIVE_SECRET_KEY'));
  
  // Log environment variable binding patterns
  const allEnvKeys = Object.keys(Deno.env.toObject());
  const stripeKeys = allEnvKeys.filter(k => k.includes('STRIPE'));
  console.log('🔍 AVAILABLE_STRIPE_VARS:', stripeKeys);
  console.log('🔍 MISSING_TARGET_VAR:', !stripeKeys.includes('STRIPE_CONNECT_SECRET_KEY'));
  
  // Track function instance for debugging
  if (!(globalThis as any).createConnectDebugId) {
    (globalThis as any).createConnectDebugId = Math.random().toString(36).substring(7);
    (globalThis as any).createConnectStartTime = Date.now();
    console.log('🔍 CREATE_CONNECT_INSTANCE:', (globalThis as any).createConnectDebugId);
  }
  
  const uptimeMs = Date.now() - (globalThis as any).createConnectStartTime;
  console.log('🔍 FUNCTION_UPTIME:', Math.round(uptimeMs / 60000) + ' minutes');
  // === STRIPE_CONNECT_SECRET_KEY INVESTIGATION END ===
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Determine environment explicitly
    const mode = getStripeMode(); // 'test' | 'live'
    console.log(`Creating Connect account in ${mode} mode`);
    
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

    if (profileError || !profile) {
      console.error("Error fetching profile:", profileError);
      return new Response(JSON.stringify({ error: 'Profile not found', details: profileError }), {
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

    // Get appropriate Stripe key using explicit mode selector
    const stripeKey = getStripeKey(mode);
    console.log(`Stripe mode=${mode} keyPrefix=${stripeKey.slice(0, 8)}`);
    if (!stripeKey) {
      console.error(`Missing Stripe Connect ${mode} secret key`);
      return new Response(JSON.stringify({ 
        error: 'Server configuration error', 
        details: `Missing Stripe ${mode} credentials` 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const originUrl = req.headers.get('origin');
    if (!originUrl) {
      console.error("Missing origin header");
      return new Response(JSON.stringify({ error: 'Missing origin header' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Define redirect URLs
    const redirectUrl = mode === 'live'
      ? 'https://studybuddyusc.com/settings?tab=payments&stripe=success'
      : `${originUrl}/settings?tab=payments&stripe=success`;
      
    const refreshUrl = mode === 'live'
      ? 'https://studybuddyusc.com/settings?tab=payments&stripe=refresh'
      : `${originUrl}/settings?tab=payments&stripe=refresh`;

    console.log(`Using redirect URL: ${redirectUrl}`);
    console.log(`Using refresh URL: ${refreshUrl}`);

    // Get the appropriate Connect account ID field based on environment
    // Note: Currently using same fields for both test and live - this can be expanded later
    const connectIdField = 'stripe_connect_id';
    const onboardingCompleteField = 'stripe_connect_onboarding_complete';

    // Check if tutor already has a Stripe Connect account for this environment
    if (profile[connectIdField]) {
      console.log(`Tutor already has Connect account in ${mode} mode: ${profile[connectIdField]}`);
      
      try {
        const stripe = new Stripe(stripeKey, {
          apiVersion: '2023-10-16',
          timeout: 30000,
        });

        // First check if the account still exists
        try {
          console.log("Verifying account exists in Stripe");
          const account = await stripe.accounts.retrieve(profile[connectIdField]);
          
          // Sanity check mode vs account livemode
          if (mode === 'test' && account.livemode) {
            throw new Error('Misconfig: test mode with a live connect account id');
          }
          if (mode === 'live' && !account.livemode) {
            throw new Error('Misconfig: live mode with a test connect account id');
          }
        } catch (retrieveError) {
          // If the account doesn't exist anymore, we'll create a new one
          if ((retrieveError as any)?.code === 'resource_missing') {
            console.log("Stripe account no longer exists, will create a new one");
            throw new Error('Account needs recreation');
          }
          throw retrieveError;
        }

        // Generate an account link for existing account
        console.log("Creating account link for existing account");
        const accountLink = await stripe.accountLinks.create({
          account: profile[connectIdField],
          refresh_url: refreshUrl,
          return_url: redirectUrl,
          type: 'account_onboarding',
        });

        console.log("Account link created successfully");
        return new Response(JSON.stringify({ url: accountLink.url, existing: true, environment: mode }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        // If we can't generate an account link or the account doesn't exist,
        // we'll create a new account below
        console.error(`Error with existing account in ${mode} mode, creating new one:`, error);
      }
    }

    // Create a new Stripe Connect account
    console.log(`Creating new Stripe Connect account in ${mode} mode`);
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      timeout: 30000,
    });

    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    
    // For live mode, specify the right client ID
    const connectAccountParams: any = {
      type: 'express',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      business_profile: {
        product_description: 'Academic tutoring services',
        url: mode === 'live' ? 'https://studybuddyusc.com' : originUrl,
        name: fullName.length > 0 ? fullName : undefined,
      },
      metadata: {
        user_id: user.id,
        environment: mode
      },
      email: user.email,
    };

    // Set the OAuth client ID for live mode
    if (mode === 'live') {
      connectAccountParams.settings = {
        branding: {
          primary_color: '#990000', // USC cardinal color
          secondary_color: '#ffcc00', // USC gold color
          icon: null,
          logo: null
        }
      };
    }

    const account = await stripe.accounts.create(connectAccountParams);

    console.log(`Created Stripe Connect account in ${mode} mode: ${account.id}`);

    // Store the Connect account ID in the user's profile, in the appropriate field
    console.log(`Updating profile with Connect account ID for ${mode} mode`);
    const updateFields: any = {
      updated_at: new Date().toISOString()
    };
    updateFields[connectIdField] = account.id;
    updateFields[onboardingCompleteField] = false;

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateFields)
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update profile', details: updateError }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create an account link for onboarding
    console.log("Creating account link for onboarding");
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: refreshUrl,
      return_url: redirectUrl,
      type: 'account_onboarding',
    });

    console.log("Account link created successfully");
    return new Response(JSON.stringify({ 
      url: accountLink.url, 
      account_id: account.id,
      environment: mode
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating Connect account:', error);
    return new Response(JSON.stringify({ 
      error: 'Error creating Connect account', 
      details: (error as any)?.message || 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
