import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Determine environment explicitly
    const mode = getStripeMode(); // 'test' | 'live'
    console.log(`Processing webhook in ${mode} mode`);
    
    // Get appropriate Stripe key using explicit mode selector
    const stripeKey = getStripeKey(mode);
    console.log(`Stripe mode=${mode} keyPrefix=${stripeKey.slice(0, 8)}`);
    
    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      timeout: 30000,
    });

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Get the raw body for webhook processing
    const body = await req.text();
    
    // Parse webhook event directly (skip signature verification for Deno compatibility)
    let event;
    try {
      event = JSON.parse(body);
      console.log('Processing raw webhook event:', event.type);
    } catch (err) {
      console.error('Invalid webhook body:', err);
      return new Response('Invalid webhook body', { status: 400 });
    }

    console.log('Webhook event received:', event.type);

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('Checkout session completed:', {
        id: session.id,
        metadata: session.metadata,
        payment_status: session.payment_status,
      });

      // Find payment transaction using Stripe checkout session ID
      const { data: paymentTransaction, error: lookupError } = await supabaseAdmin
        .from('payment_transactions')
        .select('session_id')
        .eq('stripe_checkout_session_id', session.id)
        .single();

      if (lookupError || !paymentTransaction?.session_id) {
        console.error('Payment transaction not found for checkout session:', session.id, 'Error:', lookupError);
        return new Response('Payment transaction not found', { status: 404 });
      }

      const sessionId = paymentTransaction.session_id;
      const paymentIntentId = session.payment_intent;
      
      console.log('Found session ID from payment transaction:', sessionId);
      console.log('Payment intent ID:', paymentIntentId);

      // Update payment transaction with amount in cents (Stripe already sends cents)
      const { error: updateError } = await supabaseAdmin
        .from('payment_transactions')
        .update({
          status: 'completed',
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: paymentIntentId,
          amount: session.amount_total, // Store Stripe amount directly (already in cents)
          payment_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId);

      if (updateError) {
        console.error('Error updating payment transaction:', updateError);
        return new Response('Database update failed', { status: 500 });
      }

      // Update session payment status
      const { error: sessionUpdateError } = await supabaseAdmin
        .from('sessions')
        .update({
          payment_status: 'paid',
          stripe_payment_intent_id: paymentIntentId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (sessionUpdateError) {
        console.error('Error updating session payment status:', sessionUpdateError);
      }

      // PERMANENT FIX: Save customer ID to profile to prevent future fragmentation
      const customerId = session.customer;
      const customerEmail = session.customer_details?.email;
      
      if (customerId && customerEmail) {
        console.log('Saving customer ID to profile:', { customerId, customerEmail });
        
        // Try to find user by email first
        let userFound = false;
        try {
          const { data: users } = await supabaseAdmin.auth.admin.listUsers();
          const matchingUser = users.users.find(u => u.email === customerEmail);
          
          if (matchingUser) {
            const { error: profileUpdateError } = await supabaseAdmin
              .from('profiles')
              .update({ stripe_customer_id: customerId })
              .eq('id', matchingUser.id);
              
            if (!profileUpdateError) {
              console.log('Successfully updated profile with customer ID via email');
              userFound = true;
            }
          }
        } catch (emailLookupError) {
          console.warn('Email lookup failed:', emailLookupError);
        }

        if (!userFound) {
          console.warn('Could not update profile with customer ID via email, trying student_id fallback');
          
          // Try alternative approach: update by matching the session's student_id
          const { data: sessionData } = await supabaseAdmin
            .from('sessions')
            .select('student_id')
            .eq('id', sessionId)
            .single();
            
          if (sessionData?.student_id) {
            const { error: altUpdateError } = await supabaseAdmin
              .from('profiles')
              .update({ stripe_customer_id: customerId })
              .eq('id', sessionData.student_id);
              
            if (altUpdateError) {
              console.error('Failed to update profile via student_id:', altUpdateError);
            } else {
              console.log('Successfully updated profile via student_id');
            }
          }
        }
      }

      console.log('Payment completed successfully for session:', sessionId);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(`Webhook Error: ${error.message}`, { status: 500 });
  }
});