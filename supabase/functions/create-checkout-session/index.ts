import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&bundle";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    ? Deno.env.get('STRIPE_LIVE_SECRET_KEY')
    : Deno.env.get('STRIPE_SECRET_KEY');

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Determine environment explicitly
    const mode = getStripeMode(); // 'test' | 'live'
    console.log(`Creating checkout session in ${mode} mode`);
    
    const { sessionId, amount, tutorName, studentName, sessionDate, sessionTime, userId } = await req.json();

    // Get appropriate Stripe key using explicit mode selector
    const stripeKey = getStripeKey(mode);
    console.log(`Stripe mode=${mode} keyPrefix=${stripeKey.slice(0, 8)}`);
    
    // Initialize Stripe with secret key
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      timeout: 30000,
    });

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Find existing customer ID to reuse
    let existingCustomerId = null;
    if (userId) {
      console.log('Looking for existing customer for user:', userId);
      
      // Check profile first
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();
      
      if (profile?.stripe_customer_id && !profile.stripe_customer_id.startsWith('gcus_')) {
        existingCustomerId = profile.stripe_customer_id;
        console.log('Found existing customer ID in profile:', existingCustomerId);
      } else {
        // Check payment transactions for existing customer
        const { data: transactions } = await supabaseAdmin
          .from('payment_transactions')
          .select('stripe_customer_id')
          .eq('student_id', userId)
          .not('stripe_customer_id', 'is', null)
          .not('stripe_customer_id', 'like', 'gcus_%')
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (transactions && transactions.length > 0) {
          existingCustomerId = transactions[0].stripe_customer_id;
          console.log('Found existing customer ID in transactions:', existingCustomerId);
        }
      }
    }

    // Create Stripe Checkout Session
    const sessionConfig: any = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Tutoring Session with ${tutorName}`,
              description: `${sessionDate} at ${sessionTime}`,
            },
            unit_amount: Math.round(amount), // amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get("origin")}/payment-success?session_id=${sessionId}`,
      cancel_url: `${req.headers.get("origin")}/payment-canceled?session_id=${sessionId}`,
      metadata: {
        sessionId: sessionId,
        tutorName: tutorName,
        studentName: studentName,
        userId: userId || '',
      },
    };

    // Set customer configuration - either reuse existing or create new
    if (existingCustomerId) {
      sessionConfig.customer = existingCustomerId;
      console.log('Reusing existing customer:', existingCustomerId);
    } else {
      sessionConfig.customer_creation = 'always';
      console.log('Will create new customer');
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Create payment transaction record immediately with checkout session ID
    console.log('Creating payment transaction record for session:', sessionId);
    const { error: dbError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        session_id: sessionId,
        student_id: userId,
        amount: Math.round(amount),
        status: 'pending',
        stripe_checkout_session_id: session.id,
        environment: mode,
      });

    if (dbError) {
      console.error('Error creating payment transaction:', dbError);
      // Don't fail the checkout creation, but log the error
    } else {
      console.log('Payment transaction created successfully');
    }

    return new Response(
      JSON.stringify({ 
        url: session.url,
        checkoutSessionId: session.id 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create checkout session' 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});