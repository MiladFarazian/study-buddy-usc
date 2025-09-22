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
    console.log(`Payment Intent Succeeded webhook received in ${mode} mode`);
    
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

    // Get the raw body for webhook signature verification
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('No signature provided');
      return new Response('No signature', { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log('Webhook event received:', event.type);

    // Handle payment_intent.succeeded event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      console.log('Payment Intent succeeded:', {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      });

      // Extract customer ID from payment intent
      const customerId = typeof paymentIntent.customer === 'string' 
        ? paymentIntent.customer 
        : paymentIntent.customer?.id;
      
      console.log('Customer ID from payment intent:', customerId);

      // First try to find transaction by payment intent ID (most reliable)
      let transactions;
      let fetchError;
      
      console.log('Searching for transaction by payment intent ID:', paymentIntent.id);
      const { data: transactionsByIntentId, error: intentIdError } = await supabaseAdmin
        .from('payment_transactions')
        .select('*')
        .eq('stripe_payment_intent_id', paymentIntent.id)
        .eq('status', 'pending')
        .limit(1);

      if (!intentIdError && transactionsByIntentId && transactionsByIntentId.length > 0) {
        transactions = transactionsByIntentId;
        console.log('Found transaction by payment intent ID');
      } else {
        // Fallback: Find by amount and status (less reliable but covers older transactions)
        console.log('Payment intent ID match failed, falling back to amount matching');
        const { data: transactionsByAmount, error: amountError } = await supabaseAdmin
          .from('payment_transactions')
          .select('*')
          .eq('amount', paymentIntent.amount) // Both are now in cents
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1);
        
        transactions = transactionsByAmount;
        fetchError = amountError;
      }

      if (fetchError) {
        console.error('Error fetching payment transaction:', fetchError);
        return new Response('Database fetch failed', { status: 500 });
      }

      if (!transactions || transactions.length === 0) {
        console.log('No matching payment transaction found for amount:', paymentIntent.amount, 'cents');
        // This might be normal if the payment wasn't created through your system
        return new Response(JSON.stringify({ 
          received: true, 
          message: 'No matching transaction found' 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const transaction = transactions[0];

      // Update payment transaction with customer ID
      const updateData: any = {
        status: 'completed',
        stripe_payment_intent_id: paymentIntent.id,
        stripe_checkout_session_id: paymentIntent.id, // Keep existing for compatibility
        payment_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Add customer ID if available
      if (customerId) {
        updateData.stripe_customer_id = customerId;
      }
      
      const { error: updateError } = await supabaseAdmin
        .from('payment_transactions')
        .update(updateData)
        .eq('id', transaction.id);

      if (updateError) {
        console.error('Error updating payment transaction:', updateError);
        return new Response('Database update failed', { status: 500 });
      }

      // Update user's profile with customer ID (overwrite guest customers)
      if (customerId && transaction.student_id) {
        // Always update if customer ID is different or if it's a guest customer
        const { data: currentProfile } = await supabaseAdmin
          .from('profiles')
          .select('stripe_customer_id')
          .eq('id', transaction.student_id)
          .single();
        
        const shouldUpdate = !currentProfile?.stripe_customer_id || 
          currentProfile.stripe_customer_id.startsWith('gcus_') ||
          currentProfile.stripe_customer_id !== customerId;
        
        if (shouldUpdate) {
          const { error: profileUpdateError } = await supabaseAdmin
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', transaction.student_id);
            
          if (profileUpdateError) {
            console.warn('Could not update profile with customer ID:', profileUpdateError);
          } else {
            console.log('Profile updated with customer ID:', customerId);
          }
        }
      }

      // Update session payment status and payment intent ID if session exists
      if (transaction.session_id) {
        const { error: sessionUpdateError } = await supabaseAdmin
          .from('sessions')
          .update({
            payment_status: 'paid',
            stripe_payment_intent_id: paymentIntent.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', transaction.session_id);

        if (sessionUpdateError) {
          console.error('Error updating session payment status:', sessionUpdateError);
        }
      }

      console.log('Payment completed successfully for transaction:', transaction.id);
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