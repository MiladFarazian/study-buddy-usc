
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';
import Stripe from 'https://esm.sh/stripe@12.13.0?target=deno';

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
    // Check if Stripe secret key is configured
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('Missing STRIPE_SECRET_KEY environment variable');
      return new Response(
        JSON.stringify({ 
          error: 'Stripe configuration missing. Please set the STRIPE_SECRET_KEY in Supabase edge function secrets.' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Parse request body
    const requestBody = await req.json();
    const { sessionId, amount, tutorId, studentId, description } = requestBody;

    // Validate required parameters
    if (!sessionId || !amount || !tutorId || !studentId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log(`Creating payment intent for session ${sessionId} with amount ${amount}`);

    // Initialize Stripe
    try {
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
      });

      // Create a new payment intent
      console.log('Creating new payment intent with amount:', amount);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents for Stripe
        currency: 'usd',
        metadata: {
          sessionId,
          tutorId,
          studentId,
        },
        description: description || `Tutoring session payment`,
      });
      
      console.log(`Created new payment intent: ${paymentIntent.id}`);
      
      // Return the client secret to the client
      return new Response(
        JSON.stringify({
          id: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
          amount: amount, // Keep original amount for display
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (stripeError) {
      console.error('Stripe API error:', stripeError);
      return new Response(
        JSON.stringify({ 
          error: 'Stripe API error. Please check your Stripe configuration and try again.',
          details: stripeError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create payment intent' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
