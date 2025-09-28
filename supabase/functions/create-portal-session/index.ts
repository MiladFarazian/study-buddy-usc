import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user from the request
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const { returnUrl } = await req.json();

    if (!returnUrl) {
      return new Response(
        JSON.stringify({ error: 'Return URL is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user's profile to find their Stripe customer ID
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    let customerId = profile.stripe_customer_id;

    // IGNORE guest customers (gcus_) - they don't work with billing portal
    if (customerId && customerId.startsWith('gcus_')) {
      console.log('Ignoring guest customer ID:', customerId);
      customerId = null;
    }

    // If no customer ID in profile, try to find one from payment history
    if (!customerId) {
      console.log('No customer ID in profile, checking payment history...');
      
      // Use service role key to query payment_transactions
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      const { data: paymentTransaction, error: paymentError } = await supabaseAdmin
        .from('payment_transactions')
        .select('stripe_customer_id')
        .eq('student_id', user.id)
        .not('stripe_customer_id', 'is', null)
        .not('stripe_customer_id', 'like', 'gcus_%') // Exclude guest customers
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!paymentError && paymentTransaction?.stripe_customer_id) {
        customerId = paymentTransaction.stripe_customer_id;
        console.log('Found customer ID from payment history:', customerId);
        
        // Update profile with the found customer ID for future use
        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id);
          
        if (updateError) {
          console.warn('Could not update profile with customer ID:', updateError);
        } else {
          console.log('Profile updated with customer ID from payment history');
        }
      }
    }

    // If no customer ID exists, try to find existing Stripe customer(s) by email with payment history
    if (!customerId) {
      console.log('No customer ID found in DB. Checking Stripe for existing customers by email...');
      const candidates = await stripe.customers.list({ email: user.email || undefined, limit: 20 });
      let foundCustomerId: string | null = null;

      if (candidates.data.length > 0) {
        for (const c of candidates.data) {
          // Skip guest customers (gcus_)
          if (c.id.startsWith('gcus_')) {
            console.log('Skipping guest customer:', c.id);
            continue;
          }
          
          try {
            // Prefer customers that have any payment intents (indicates real payment history)
            const intents = await stripe.paymentIntents.list({ customer: c.id, limit: 1 });
            if (intents.data.length > 0) {
              foundCustomerId = c.id;
              console.log('Matched existing Stripe customer with payment history:', foundCustomerId);
              break;
            }
          } catch (e) {
            console.warn('Error checking payment intents for customer', c.id, e);
          }
        }

        // If none have payment history, fall back to first non-guest existing customer
        if (!foundCustomerId) {
          const nonGuestCustomer = candidates.data.find(c => !c.id.startsWith('gcus_'));
          if (nonGuestCustomer) {
            foundCustomerId = nonGuestCustomer.id;
            console.log('No customer with payment history found; using first non-guest customer:', foundCustomerId);
          }
        }
      }

      if (foundCustomerId) {
        customerId = foundCustomerId;
        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id);

        if (updateError) {
          console.warn('Could not update profile with existing Stripe customer ID:', updateError);
        } else {
          console.log('Profile updated with existing Stripe customer ID from Stripe search');
        }
      }
    }

    // If still no customer, create a new Stripe customer
    if (!customerId) {
      console.log('Creating new Stripe customer for user:', user.id);
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      customerId = customer.id;

      // Update the profile with the new customer ID
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile with customer ID:', updateError);
      } else {
        console.log('Profile updated with new customer ID');
      }
    }

    // Create portal session
    console.log('Creating portal session for customer:', customerId);
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    console.log('Portal session created successfully');

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error creating portal session:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create portal session',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});