
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';
import Stripe from 'https://esm.sh/stripe@12.13.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to determine if we're in production
const isProduction = () => {
  // Check for production hostname
  const hostname = Deno.env.get('HOSTNAME') || '';
  const isDeploy = hostname.includes('studybuddyusc.com') || hostname.includes('prod');
  
  // Override for explicit environment variable
  const envFlag = Deno.env.get('USE_PRODUCTION_STRIPE');
  if (envFlag === 'true') return true;
  if (envFlag === 'false') return false;
  
  return isDeploy;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Determine the environment
    const environment = isProduction() ? 'production' : 'test';
    console.log(`Processing transfers in ${environment} mode`);
    
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const { tutorId } = await req.json();
    
    if (!tutorId) {
      return new Response(JSON.stringify({ error: 'Tutor ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if the user is authorized
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Only allow the tutor themselves or admins to process this
    const isAuthorized = userProfile?.role === 'admin' || user.id === tutorId;
    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Not authorized to process transfers for this tutor' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the appropriate Connect account ID field based on environment
    const connectIdField = isProduction() ? 'stripe_connect_live_id' : 'stripe_connect_id';
    const onboardingCompleteField = isProduction() ? 'stripe_connect_live_onboarding_complete' : 'stripe_connect_onboarding_complete';

    // Get the tutor's Stripe Connect ID
    const { data: tutorProfile, error: tutorError } = await supabaseAdmin
      .from('profiles')
      .select(`${connectIdField}, ${onboardingCompleteField}, first_name, last_name`)
      .eq('id', tutorId)
      .single();

    if (tutorError || !tutorProfile) {
      return new Response(JSON.stringify({ error: 'Tutor profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!tutorProfile[connectIdField] || !tutorProfile[onboardingCompleteField]) {
      return new Response(JSON.stringify({ 
        error: `Tutor has not completed Stripe Connect onboarding in ${environment} mode`,
        code: 'connect_incomplete',
        environment
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get pending transfers for this tutor
    const { data: pendingTransfers, error: transfersError } = await supabaseAdmin
      .from('pending_transfers')
      .select('*')
      .eq('tutor_id', tutorId)
      .eq('status', 'pending');

    if (transfersError) {
      return new Response(JSON.stringify({ error: 'Error retrieving pending transfers' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!pendingTransfers || pendingTransfers.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No pending transfers found for this tutor',
        transfersProcessed: 0,
        environment
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Stripe with the appropriate key
    const stripeSecretKey = isProduction()
      ? Deno.env.get('STRIPE_CONNECT_LIVE_SECRET_KEY')
      : Deno.env.get('STRIPE_CONNECT_SECRET_KEY');
      
    if (!stripeSecretKey) {
      return new Response(JSON.stringify({ 
        error: `Missing Stripe Connect ${environment} secret key` 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const results = [];
    const transfersProcessed = [];

    // Process each pending transfer
    for (const transfer of pendingTransfers) {
      try {
        // Create a transfer to the tutor's connect account
        const newTransfer = await stripe.transfers.create({
          amount: Math.round(transfer.amount * 100), // Convert to cents
          currency: 'usd',
          destination: tutorProfile[connectIdField],
          transfer_group: transfer.transfer_group,
          metadata: {
            session_id: transfer.session_id,
            tutor_id: transfer.tutor_id,
            student_id: transfer.student_id,
            payment_transaction_id: transfer.payment_transaction_id,
            pending_transfer_id: transfer.id,
            environment
          },
          description: `Tutor payment for session ${transfer.session_id} (${environment})`
        });

        // Update the pending transfer record
        await supabaseAdmin
          .from('pending_transfers')
          .update({
            status: 'completed',
            transfer_id: newTransfer.id,
            processed_at: new Date().toISOString(),
            processor: `manual_${environment}`
          })
          .eq('id', transfer.id);
          
        transfersProcessed.push(transfer.id);
        results.push({
          pendingTransferId: transfer.id,
          transferId: newTransfer.id,
          status: 'completed',
          environment
        });
      } catch (error) {
        console.error(`Error processing transfer ${transfer.id}:`, error);
        results.push({
          pendingTransferId: transfer.id,
          error: error.message,
          status: 'failed',
          environment
        });
      }
    }

    return new Response(JSON.stringify({ 
      message: `Processed ${transfersProcessed.length} transfers for tutor in ${environment} mode`,
      results,
      transfersProcessed,
      environment
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error processing transfers:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
