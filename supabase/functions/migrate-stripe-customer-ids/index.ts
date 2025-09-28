// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.13.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get Stripe configuration
const getStripeMode = (): 'test' | 'live' => {
  return (Deno.env.get('STRIPE_MODE') || 'test') as 'test' | 'live';
};

const getStripeKey = (mode: 'test' | 'live'): string => {
  const keyEnvVar = mode === 'live' ? 'STRIPE_LIVE_SECRET_KEY' : 'STRIPE_SECRET_KEY';
  const key = Deno.env.get(keyEnvVar);
  
  if (!key) {
    throw new Error(`Missing ${keyEnvVar} environment variable`);
  }
  return key;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting customer ID migration...');

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Initialize Stripe
    const stripeMode = getStripeMode();
    const stripeKey = getStripeKey(stripeMode);
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    console.log('Fetching payment transactions with payment intent IDs...');

    // Get all payment transactions that have payment intent IDs but no customer IDs
    const { data: transactions, error: fetchError } = await supabase
      .from('payment_transactions')
      .select('id, stripe_payment_intent_id, student_id')
      .not('stripe_payment_intent_id', 'is', null)
      .is('stripe_customer_id', null);

    if (fetchError) {
      console.error('Error fetching transactions:', fetchError);
      throw new Error(`Failed to fetch transactions: ${fetchError.message}`);
    }

    console.log(`Found ${transactions?.length || 0} transactions to migrate`);

    let migratedCount = 0;
    let errorCount = 0;
    const results = [];

    for (const transaction of transactions || []) {
      try {
        console.log(`Processing payment intent: ${transaction.stripe_payment_intent_id}`);

        // Retrieve payment intent from Stripe to get customer ID
        const paymentIntent = await stripe.paymentIntents.retrieve(
          transaction.stripe_payment_intent_id
        );

        if (paymentIntent.customer) {
          const customerId = typeof paymentIntent.customer === 'string' 
            ? paymentIntent.customer 
            : paymentIntent.customer.id;

          console.log(`Found customer ID: ${customerId} for transaction: ${transaction.id}`);

          // Update the payment transaction with customer ID
          const { error: updateError } = await supabase
            .from('payment_transactions')
            .update({ stripe_customer_id: customerId })
            .eq('id', transaction.id);

          if (updateError) {
            console.error(`Error updating transaction ${transaction.id}:`, updateError);
            errorCount++;
            results.push({
              transactionId: transaction.id,
              paymentIntentId: transaction.stripe_payment_intent_id,
              success: false,
              error: updateError.message
            });
          } else {
            // Update the user's profile with the customer ID if it doesn't have one
            const { error: profileUpdateError } = await supabase
              .from('profiles')
              .update({ stripe_customer_id: customerId })
              .eq('id', transaction.student_id)
              .is('stripe_customer_id', null);

            if (profileUpdateError) {
              console.warn(`Could not update profile for user ${transaction.student_id}:`, profileUpdateError);
            }

            migratedCount++;
            results.push({
              transactionId: transaction.id,
              paymentIntentId: transaction.stripe_payment_intent_id,
              customerId: customerId,
              success: true
            });
            console.log(`✓ Migrated transaction ${transaction.id}`);
          }
        } else {
          console.warn(`No customer ID found for payment intent: ${transaction.stripe_payment_intent_id}`);
          results.push({
            transactionId: transaction.id,
            paymentIntentId: transaction.stripe_payment_intent_id,
            success: false,
            error: 'No customer ID in payment intent'
          });
        }
      } catch (stripeError) {
        console.error(`Stripe error for transaction ${transaction.id}:`, stripeError);
        errorCount++;
        results.push({
          transactionId: transaction.id,
          paymentIntentId: transaction.stripe_payment_intent_id,
          success: false,
          error: stripeError.message
        });
      }
    }

    console.log(`Migration completed: ${migratedCount} successful, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Migration completed: ${migratedCount} successful, ${errorCount} errors`,
        migratedCount,
        errorCount,
        totalProcessed: (transactions?.length || 0),
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Migration error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Failed to migrate customer IDs'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});