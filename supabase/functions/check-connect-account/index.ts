
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno&bundle';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to retry Stripe API calls with exponential backoff
const retryStripeOperation = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 3
): Promise<T> => {
  const delays = [200, 500, 1000]; // ms
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const startTime = Date.now();
      const result = await operation();
      const duration = Date.now() - startTime;
      console.log(`${operationName} completed in ${duration}ms (attempt ${attempt + 1})`);
      return result;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;
      const isRetryableError = error.type === 'StripeConnectionError' || 
                              error.code === 'rate_limit' ||
                              (error.message && error.message.includes('runMicrotasks'));
      
      console.log(`${operationName} attempt ${attempt + 1} failed:`, {
        error: error.message,
        type: error.type,
        code: error.code,
        retryable: isRetryableError,
        isLastAttempt
      });
      
      if (isLastAttempt || !isRetryableError) {
        throw error;
      }
      
      if (attempt < delays.length) {
        console.log(`Retrying ${operationName} in ${delays[attempt]}ms...`);
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
      }
    }
  }
  
  throw new Error(`${operationName} failed after ${maxRetries} attempts`);
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
  console.log("Check Connect Account function invoked");
  
  // === STRIPE_CONNECT_SECRET_KEY TRACING CODE START ===
  console.log('=== ENVIRONMENT VARIABLE TRACING ===');
  console.log('Initial STRIPE_CONNECT_SECRET_KEY:', !!Deno.env.get('STRIPE_CONNECT_SECRET_KEY'));
  console.log('Initial SECRET KEY VALUE LENGTH:', (Deno.env.get('STRIPE_CONNECT_SECRET_KEY') || '').length);
  
  // Trace all environment variable access
  const originalGet = Deno.env.get;
  Deno.env.get = function(key) {
    const value = originalGet.call(this, key);
    if (key === 'STRIPE_CONNECT_SECRET_KEY') {
      const stack = new Error().stack.split('\n')[2];
      console.log(`SECRET_ACCESS_TRACE: ${key} = ${value ? 'EXISTS' : 'MISSING'} called from: ${stack}`);
    }
    return value;
  };
  // === STRIPE_CONNECT_SECRET_KEY TRACING CODE END ===
  
  // === SECRET ACCESS DEBUG CODE START ===
  const secretValue = Deno.env.get('STRIPE_CONNECT_SECRET_KEY');
  const secretExists = !!secretValue;
  const secretLength = secretValue?.length || 0;
  const timestamp = new Date().toISOString();

  console.log(`SECRET_TRACKING: ${timestamp} | exists: ${secretExists} | length: ${secretLength}`);

  // Track function instance lifecycle
  if (!globalThis.functionInstanceId) {
    globalThis.functionInstanceId = Math.random().toString(36);
    globalThis.functionStartTime = Date.now();
    globalThis.secretFirstSeen = timestamp;
    console.log(`SECRET_LIFECYCLE: First access at ${timestamp}`);
  }

  const timeSinceFirst = new Date() - new Date(globalThis.secretFirstSeen);
  console.log(`SECRET_LIFECYCLE: ${Math.round(timeSinceFirst / 60000)} minutes since first access`);
  console.log(`INSTANCE_TRACKING: ID=${globalThis.functionInstanceId} | uptime=${Date.now() - globalThis.functionStartTime}ms`);

  // Log all STRIPE environment variables
  const allEnvKeys = Object.keys(Deno.env.toObject());
  const stripeKeys = allEnvKeys.filter(k => k.includes('STRIPE'));
  console.log('STRIPE_ENV_VARS:', stripeKeys);
  // === SECRET ACCESS DEBUG CODE END ===
  
  // === ENVIRONMENT STABILITY MONITORING START ===
  // Track environment variable stability over multiple function calls
  if (!globalThis.envStabilityTracker) {
    globalThis.envStabilityTracker = {
      functionInstanceId: Math.random().toString(36).substring(7),
      functionStartTime: Date.now(),
      secretAccessLog: [],
      environmentSnapshots: []
    };
    console.log('🔍 ENV_STABILITY: Initialized tracker', {
      instanceId: globalThis.envStabilityTracker.functionInstanceId
    });
  }
  
  // Take environment snapshot
  const currentTime = Date.now();
  const envSnapshot = {
    timestamp: currentTime,
    uptimeMs: currentTime - globalThis.envStabilityTracker.functionStartTime,
    stripeSecrets: {
      STRIPE_CONNECT_SECRET_KEY: !!Deno.env.get('STRIPE_CONNECT_SECRET_KEY'),
      STRIPE_CONNECT_LIVE_SECRET_KEY: !!Deno.env.get('STRIPE_CONNECT_LIVE_SECRET_KEY'),
      STRIPE_SECRET_KEY: !!Deno.env.get('STRIPE_SECRET_KEY'),
      STRIPE_PUBLISHABLE_KEY: !!Deno.env.get('STRIPE_PUBLISHABLE_KEY'),
      STRIPE_WEBHOOK_SECRET: !!Deno.env.get('STRIPE_WEBHOOK_SECRET')
    }
  };
  
  globalThis.envStabilityTracker.environmentSnapshots.push(envSnapshot);
  
  // Keep only last 50 snapshots to prevent memory issues
  if (globalThis.envStabilityTracker.environmentSnapshots.length > 50) {
    globalThis.envStabilityTracker.environmentSnapshots = 
      globalThis.envStabilityTracker.environmentSnapshots.slice(-50);
  }
  
  // Log stability analysis
  const uptimeMinutes = Math.round(envSnapshot.uptimeMs / 60000);
  console.log('🔍 ENV_STABILITY:', {
    uptimeMinutes,
    snapshotCount: globalThis.envStabilityTracker.environmentSnapshots.length,
    currentSecretState: envSnapshot.stripeSecrets,
    criticalMissing: !envSnapshot.stripeSecrets.STRIPE_CONNECT_SECRET_KEY
  });
  
  // Check for degradation patterns
  if (globalThis.envStabilityTracker.environmentSnapshots.length > 1) {
    const previousSnapshot = globalThis.envStabilityTracker.environmentSnapshots[
      globalThis.envStabilityTracker.environmentSnapshots.length - 2
    ];
    
    Object.keys(envSnapshot.stripeSecrets).forEach(secretName => {
      const wasAvailable = previousSnapshot.stripeSecrets[secretName];
      const isAvailable = envSnapshot.stripeSecrets[secretName];
      
      if (wasAvailable && !isAvailable) {
        console.error('🚨 SECRET_DEGRADATION:', {
          secretName,
          degradedAt: uptimeMinutes + ' minutes',
          previousState: 'AVAILABLE',
          currentState: 'MISSING'
        });
      } else if (!wasAvailable && isAvailable) {
        console.log('✅ SECRET_RECOVERY:', {
          secretName,
          recoveredAt: uptimeMinutes + ' minutes',
          previousState: 'MISSING',
          currentState: 'AVAILABLE'
        });
      }
    });
  }
  // === ENVIRONMENT STABILITY MONITORING END ===

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Determine environment explicitly
    const mode = getStripeMode(); // 'test' | 'live'
    console.log(`Checking Connect account in ${mode} mode`);
    
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

    // Get the appropriate Connect account ID field based on environment
    // Note: Currently using same fields for both test and live - this can be expanded later
    const connectIdField = 'stripe_connect_id';
    const onboardingCompleteField = 'stripe_connect_onboarding_complete';
    
    console.log(`Checking if tutor has a Stripe Connect account in ${mode} mode`);
    
    // Check if tutor has a Stripe Connect account for this mode
    if (!profile[connectIdField]) {
      console.log(`No Stripe Connect account found for tutor in ${mode} mode`);
      return new Response(JSON.stringify({ 
        has_account: false,
        needs_onboarding: true,
        payouts_enabled: false,
        environment: mode
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Stripe Connect ID found: ${profile[connectIdField]}`);
    console.log(`Checking Stripe Connect account status in ${mode} mode`);
    
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
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      timeout: 30000, // 30 second timeout
    });

    try {
      console.log(`Retrieving Stripe account: ${profile[connectIdField]}`);
      
      // Use retry logic for Stripe API call
      const account = await retryStripeOperation(
        () => stripe.accounts.retrieve(profile[connectIdField]),
        'stripe.accounts.retrieve'
      );
      
      console.log("Account retrieved successfully:", {
        details_submitted: account.details_submitted,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled
      });
      
      // Sanity check mode vs account livemode
      if (mode === 'test' && account.livemode) {
        throw new Error('Misconfig: test mode with a live connect account id');
      }
      if (mode === 'live' && !account.livemode) {
        throw new Error('Misconfig: live mode with a test connect account id');
      }
      
      const onboardingComplete = account.details_submitted && account.payouts_enabled;
      
      // Update onboarding status in the profile if needed
      if (onboardingComplete !== profile[onboardingCompleteField]) {
        console.log(`Updating onboarding status from ${profile[onboardingCompleteField]} to ${onboardingComplete} for ${mode} mode`);
        const updateFields: any = { updated_at: new Date().toISOString() };
        updateFields[onboardingCompleteField] = onboardingComplete;
        
        await supabaseAdmin
          .from('profiles')
          .update(updateFields)
          .eq('id', user.id);
      }

      return new Response(JSON.stringify({
        has_account: true,
        account_id: profile[connectIdField],
        details_submitted: account.details_submitted,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        needs_onboarding: !onboardingComplete,
        environment: mode
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (stripeError) {
      console.error("Error retrieving Stripe account after retries:", stripeError);
      
      // Handle rate limiting specifically
      if (stripeError.code === 'rate_limit') {
        return new Response(JSON.stringify({ 
          error: 'Rate limited by Stripe', 
          details: 'Too many requests, please try again later',
          retry_after: stripeError.headers?.['retry-after'] || 60
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // If the account doesn't exist or was deleted
      if (stripeError.code === 'resource_missing') {
        console.log(`Stripe account no longer exists in ${mode} mode, resetting profile`);
        // Reset the Connect ID in the profile for this mode
        const resetFields: any = { updated_at: new Date().toISOString() };
        resetFields[connectIdField] = null;
        resetFields[onboardingCompleteField] = false;
        
        await supabaseAdmin
          .from('profiles')
          .update(resetFields)
          .eq('id', user.id);
          
        return new Response(JSON.stringify({ 
          has_account: false,
          needs_onboarding: true,
          payouts_enabled: false,
          error: `Previous account no longer exists in ${mode} mode`,
          environment: mode
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Handle authentication/permission errors
      if (stripeError.type === 'StripePermissionError' || stripeError.type === 'StripeAuthenticationError') {
        return new Response(JSON.stringify({ 
          error: 'Stripe authentication error', 
          details: 'Invalid Stripe credentials configuration'
        }), {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Handle connection errors that might be temporary
      if (stripeError.type === 'StripeConnectionError') {
        return new Response(JSON.stringify({ 
          error: 'Stripe connection error', 
          details: 'Temporary connection issue, please try again'
        }), {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // For other Stripe errors
      return new Response(JSON.stringify({ 
        error: 'Error retrieving Stripe account', 
        details: stripeError.message,
        type: stripeError.type || 'unknown'
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
