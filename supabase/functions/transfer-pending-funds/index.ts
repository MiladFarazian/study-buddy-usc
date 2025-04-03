
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

    // Get the tutor's Stripe Connect ID
    const { data: tutorProfile, error: tutorError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_connect_id, stripe_connect_onboarding_complete, first_name, last_name')
      .eq('id', tutorId)
      .single();

    if (tutorError || !tutorProfile) {
      return new Response(JSON.stringify({ error: 'Tutor profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!tutorProfile.stripe_connect_id || !tutorProfile.stripe_connect_onboarding_complete) {
      return new Response(JSON.stringify({ 
        error: 'Tutor has not completed Stripe Connect onboarding',
        code: 'connect_incomplete'
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
        transfersProcessed: 0
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_CONNECT_SECRET_KEY') || '', {
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
          destination: tutorProfile.stripe_connect_id,
          transfer_group: transfer.transfer_group,
          metadata: {
            session_id: transfer.session_id,
            tutor_id: transfer.tutor_id,
            student_id: transfer.student_id,
            payment_transaction_id: transfer.payment_transaction_id,
            pending_transfer_id: transfer.id
          },
          description: `Tutor payment for session ${transfer.session_id}`
        });

        // Update the pending transfer record
        await supabaseAdmin
          .from('pending_transfers')
          .update({
            status: 'completed',
            transfer_id: newTransfer.id,
            processed_at: new Date().toISOString()
          })
          .eq('id', transfer.id);
          
        transfersProcessed.push(transfer.id);
        results.push({
          pendingTransferId: transfer.id,
          transferId: newTransfer.id,
          status: 'completed'
        });
      } catch (error) {
        console.error(`Error processing transfer ${transfer.id}:`, error);
        results.push({
          pendingTransferId: transfer.id,
          error: error.message,
          status: 'failed'
        });
      }
    }

    return new Response(JSON.stringify({ 
      message: `Processed ${transfersProcessed.length} transfers for tutor`,
      results,
      transfersProcessed
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
