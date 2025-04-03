
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';
import Stripe from 'https://esm.sh/stripe@12.13.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("Create Connect Account function invoked");
  
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

    const originUrl = req.headers.get('origin');
    if (!originUrl) {
      console.error("Missing origin header");
      return new Response(JSON.stringify({ error: 'Missing origin header' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if tutor already has a Stripe Connect account
    if (profile.stripe_connect_id) {
      console.log(`Tutor already has Connect account: ${profile.stripe_connect_id}`);
      
      try {
        const stripe = new Stripe(stripeKey, {
          apiVersion: '2023-10-16',
        });

        // First check if the account still exists
        try {
          console.log("Verifying account exists in Stripe");
          await stripe.accounts.retrieve(profile.stripe_connect_id);
        } catch (retrieveError) {
          // If the account doesn't exist anymore, we'll create a new one
          if (retrieveError.code === 'resource_missing') {
            console.log("Stripe account no longer exists, will create a new one");
            throw new Error('Account needs recreation');
          }
          throw retrieveError;
        }

        // Generate an account link for existing account
        console.log("Creating account link for existing account");
        const accountLink = await stripe.accountLinks.create({
          account: profile.stripe_connect_id,
          refresh_url: `${originUrl}/settings?tab=payments&stripe=refresh`,
          return_url: `${originUrl}/settings?tab=payments&stripe=success`,
          type: 'account_onboarding',
        });

        console.log("Account link created successfully");
        return new Response(JSON.stringify({ url: accountLink.url, existing: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        // If we can't generate an account link or the account doesn't exist,
        // we'll create a new account below
        console.error("Error with existing account, creating new one:", error);
      }
    }

    // Create a new Stripe Connect account
    console.log("Creating new Stripe Connect account");
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    
    const account = await stripe.accounts.create({
      type: 'express',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      business_profile: {
        product_description: 'Academic tutoring services',
        url: originUrl,
        name: fullName.length > 0 ? fullName : undefined,
      },
      metadata: {
        user_id: user.id,
      },
      email: user.email,
    });

    console.log(`Created Stripe Connect account: ${account.id}`);

    // Store the Connect account ID in the user's profile
    console.log("Updating profile with Connect account ID");
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        stripe_connect_id: account.id,
        stripe_connect_onboarding_complete: false,
        updated_at: new Date().toISOString()
      })
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
      refresh_url: `${originUrl}/settings?tab=payments&stripe=refresh`,
      return_url: `${originUrl}/settings?tab=payments&stripe=success`,
      type: 'account_onboarding',
    });

    console.log("Account link created successfully");
    return new Response(JSON.stringify({ url: accountLink.url, account_id: account.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating Connect account:', error);
    return new Response(JSON.stringify({ 
      error: 'Error creating Connect account', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
