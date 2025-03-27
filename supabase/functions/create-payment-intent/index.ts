
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.5.0?target=deno";

// These will be replaced with your actual keys
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }
  
  try {
    const { sessionId, amount, tutorId, studentId, description } = await req.json();
    
    console.log("Creating payment intent with:", { sessionId, amount, tutorId, studentId });
    
    // Create a Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents
      currency: "usd",
      payment_method_types: ["card"], // Explicitly specify payment method types
      metadata: {
        sessionId,
        tutorId,
        studentId,
      },
      description,
    });
    
    console.log("Payment intent created:", paymentIntent.id);
    
    // Store the payment intent in the database
    const { error: dbError } = await supabase
      .from('payment_transactions')
      .update({ 
        stripe_payment_intent_id: paymentIntent.id,
        status: 'processing'
      })
      .eq('session_id', sessionId);
      
    if (dbError) {
      console.error("Error updating payment transaction:", dbError);
    }
    
    // Return the payment intent details to the client
    return new Response(
      JSON.stringify({
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: amount,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 400,
      }
    );
  }
});
