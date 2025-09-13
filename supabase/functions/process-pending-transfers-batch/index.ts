import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get Stripe mode and key
function getStripeMode() {
  const mode = Deno.env.get('STRIPE_MODE');
  return mode === 'live' ? 'live' : 'test';
}

function getStripeKey(mode: string) {
  const key = mode === 'live' 
    ? Deno.env.get('STRIPE_LIVE_SECRET_KEY') || Deno.env.get('STRIPE_CONNECT_LIVE_SECRET_KEY')
    : Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('STRIPE_CONNECT_SECRET_KEY');
  
  if (!key) {
    throw new Error(`Stripe ${mode} secret key not found`);
  }
  
  return key;
}

interface ProcessingResult {
  newTransfersProcessed: number;
  retriesProcessed: number;
  adminNotificationsSent: number;
  errors: string[];
}

interface PendingTransfer {
  id: string;
  tutor_id: string;
  student_id: string;
  session_id: string;
  amount: number;
  platform_fee: number;
  status: string;
  retry_count: number;
  last_retry_at: string | null;
  created_at: string;
}

async function checkStripeBalance(stripe: Stripe): Promise<number> {
  console.log('[TRANSFER-PROCESSOR] Checking Stripe balance...');
  try {
    const balance = await stripe.balance.retrieve();
    const availableAmount = balance.available?.[0]?.amount || 0;
    console.log(`[TRANSFER-PROCESSOR] Available balance: $${availableAmount / 100}`);
    return availableAmount;
  } catch (error: any) {
    console.error('[TRANSFER-PROCESSOR] Error checking balance:', error);
    throw new Error(`Stripe balance check failed: ${error.message}`);
  }
}

async function processTransferBatch(
  supabase: any,
  transfers: PendingTransfer[],
  stripe: Stripe,
  mode: string
): Promise<number> {
  console.log(`[TRANSFER-PROCESSOR] Processing ${transfers.length} transfers`);
  
  let processed = 0;
  
  for (const transfer of transfers) {
    try {
      console.log(`[TRANSFER-PROCESSOR] Processing transfer ${transfer.id} - Amount: ${transfer.amount}¢`);
      
      // Check Stripe balance
      const availableBalance = await checkStripeBalance(stripe);
      // transfer.amount is already in cents after migration
      const transferAmountCents = Math.round(transfer.amount);
      
      if (availableBalance < transferAmountCents) {
        console.log(`[TRANSFER-PROCESSOR] Insufficient balance for transfer ${transfer.id}. Need: ${transferAmountCents}¢, Have: ${availableBalance}¢`);
        
        // Update retry count and last_retry_at
        await supabase
          .from('pending_transfers')
          .update({
            retry_count: (transfer.retry_count || 0) + 1,
            last_retry_at: new Date().toISOString()
          })
          .eq('id', transfer.id);
          
        break; // Stop processing if insufficient funds
      }
      
      // Update status to processing
      await supabase
        .from('pending_transfers')
        .update({ status: 'processing' })
        .eq('id', transfer.id);
      
      // Get tutor's Connect account info
      console.log(`[TRANSFER-PROCESSOR] Getting Connect account for tutor ${transfer.tutor_id}`);
      const { data: tutorProfile, error: tutorError } = await supabase
        .from('profiles')
        .select('stripe_connect_id, stripe_connect_onboarding_complete, first_name, last_name')
        .eq('id', transfer.tutor_id)
        .single();

      if (tutorError || !tutorProfile) {
        console.error(`[TRANSFER-PROCESSOR] Tutor profile not found for ${transfer.id}:`, tutorError);
        
        // Update retry info
        await supabase
          .from('pending_transfers')
          .update({
            status: 'pending',
            retry_count: (transfer.retry_count || 0) + 1,
            last_retry_at: new Date().toISOString()
          })
          .eq('id', transfer.id);
          
        continue;
      }

      // Validate Connect account is ready
      if (!tutorProfile.stripe_connect_id || !tutorProfile.stripe_connect_onboarding_complete) {
        console.error(`[TRANSFER-PROCESSOR] Tutor Connect account not ready for ${transfer.id}. ID: ${tutorProfile.stripe_connect_id}, Complete: ${tutorProfile.stripe_connect_onboarding_complete}`);
        
        // Update retry info
        await supabase
          .from('pending_transfers')
          .update({
            status: 'pending',
            retry_count: (transfer.retry_count || 0) + 1,
            last_retry_at: new Date().toISOString()
          })
          .eq('id', transfer.id);
          
        continue;
      }
      
      // Create Stripe transfer directly
      console.log(`[TRANSFER-PROCESSOR] Creating Stripe transfer for ${transfer.id} to ${tutorProfile.stripe_connect_id}`);
      
      const stripeTransfer = await stripe.transfers.create({
        amount: transferAmountCents,
        currency: 'usd',
        destination: tutorProfile.stripe_connect_id,
        transfer_group: transfer.transfer_group || `session_${transfer.session_id}`,
        metadata: {
          session_id: transfer.session_id,
          tutor_id: transfer.tutor_id,
          student_id: transfer.student_id,
          payment_transaction_id: transfer.payment_transaction_id,
          pending_transfer_id: transfer.id,
          environment: mode
        },
        description: `Tutor payment for session ${transfer.session_id} (${mode})`
      });
      
      // CRITICAL: Only mark completed if we have stripe_transfer_id
      if (stripeTransfer.id) {
        console.log(`[TRANSFER-PROCESSOR] Transfer ${transfer.id} completed with Stripe ID: ${stripeTransfer.id}`);
        
        // Mark as completed with stripe_transfer_id
        await supabase
          .from('pending_transfers')
          .update({
            status: 'completed',
            stripe_transfer_id: stripeTransfer.id, // This is the critical fix
            processed_at: new Date().toISOString(),
            processor: 'automated-batch'
          })
          .eq('id', transfer.id);
          
        processed++;
      } else {
        console.error(`[TRANSFER-PROCESSOR] Transfer ${transfer.id} failed: No Stripe transfer ID returned`);
        
        // Update retry info - keep as pending
        await supabase
          .from('pending_transfers')
          .update({
            status: 'pending',
            retry_count: (transfer.retry_count || 0) + 1,
            last_retry_at: new Date().toISOString()
          })
          .eq('id', transfer.id);
      }
      
    } catch (error: any) {
      console.error(`[TRANSFER-PROCESSOR] Error processing transfer ${transfer.id}:`, error);
      
      try {
        // Update retry info - keep as pending on failure
        await supabase
          .from('pending_transfers')
          .update({
            status: 'pending',
            retry_count: (transfer.retry_count || 0) + 1,
            last_retry_at: new Date().toISOString()
          })
          .eq('id', transfer.id);
      } catch (dbError: any) {
        console.error(`[TRANSFER-PROCESSOR] Failed to update retry info for ${transfer.id}:`, dbError);
      }
    }
  }
  
  return processed;
}

async function processNewTransfers(supabase: any, stripe: Stripe, mode: string): Promise<number> {
  console.log('[TRANSFER-PROCESSOR] Processing new transfers...');
  
  try {
    // Query new transfers ready for processing (24h+ after session completion)
    const { data: transfers, error } = await supabase
      .from('pending_transfers')
      .select(`
        *,
        sessions!fk_pending_transfers_session(completion_date)
      `)
      .eq('status', 'pending')
      .lt('retry_count', 3)
      .not('sessions.completion_date', 'is', null)
      .lte('sessions.completion_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true })
      .limit(20);
    
    if (error) {
      console.error('[TRANSFER-PROCESSOR] Error querying new transfers:', error);
      throw error;
    }
    
    if (!transfers || transfers.length === 0) {
      console.log('[TRANSFER-PROCESSOR] No new transfers ready for processing');
      return 0;
    }
    
    console.log(`[TRANSFER-PROCESSOR] Found ${transfers.length} new transfers ready for processing`);
    return await processTransferBatch(supabase, transfers, stripe, mode);
    
  } catch (error: any) {
    console.error('[TRANSFER-PROCESSOR] Error in processNewTransfers:', error);
    throw error;
  }
}

async function processRetries(supabase: any, stripe: Stripe, mode: string): Promise<number> {
  console.log('[TRANSFER-PROCESSOR] Processing retry transfers...');
  
  try {
    // Query failed transfers ready for retry (24h+ since last retry)
    const { data: transfers, error } = await supabase
      .from('pending_transfers')
      .select(`
        *,
        sessions!fk_pending_transfers_session(completion_date)
      `)
      .eq('status', 'pending')
      .gt('retry_count', 0)
      .lt('retry_count', 3)
      .lte('last_retry_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('last_retry_at', { ascending: true })
      .limit(20);
    
    if (error) {
      console.error('[TRANSFER-PROCESSOR] Error querying retry transfers:', error);
      throw error;
    }
    
    if (!transfers || transfers.length === 0) {
      console.log('[TRANSFER-PROCESSOR] No retry transfers ready for processing');
      return 0;
    }
    
    console.log(`[TRANSFER-PROCESSOR] Found ${transfers.length} retry transfers ready for processing`);
    return await processTransferBatch(supabase, transfers, stripe, mode);
    
  } catch (error: any) {
    console.error('[TRANSFER-PROCESSOR] Error in processRetries:', error);
    throw error;
  }
}

async function sendAdminNotifications(supabase: any): Promise<number> {
  console.log('[TRANSFER-PROCESSOR] Checking for failed transfers needing admin notification...');
  
  try {
    // Query transfers that have failed permanently (retry_count >= 3)
    const { data: failedTransfers, error } = await supabase
      .from('pending_transfers')
      .select('*')
      .eq('status', 'pending')
      .gte('retry_count', 3)
      .neq('status', 'failed_permanent');
    
    if (error) {
      console.error('[TRANSFER-PROCESSOR] Error querying failed transfers:', error);
      throw error;
    }
    
    if (!failedTransfers || failedTransfers.length === 0) {
      console.log('[TRANSFER-PROCESSOR] No failed transfers needing admin notification');
      return 0;
    }
    
    console.log(`[TRANSFER-PROCESSOR] Found ${failedTransfers.length} failed transfers, sending admin notification`);
    
    // Prepare notification email content
    const transferDetails = failedTransfers.map(t => 
      `Transfer ID: ${t.id}\nTutor ID: ${t.tutor_id}\nAmount: ${t.amount}¢\nRetry Count: ${t.retry_count}\nLast Retry: ${t.last_retry_at}\n`
    ).join('\n---\n');
    
    // Send admin notification
    const { data: emailResult, error: emailError } = await supabase.functions.invoke(
      'send-notification-email',
      {
        body: {
          to: Deno.env.get('RESEND_FROM') || 'admin@example.com', // Use configured admin email
          subject: `🚨 Transfer Processing Failures - ${failedTransfers.length} transfers need attention`,
          text: `The following transfers have failed 3 times and require manual intervention:\n\n${transferDetails}`,
          html: `
            <h2>🚨 Transfer Processing Failures</h2>
            <p>The following ${failedTransfers.length} transfers have failed 3 times and require manual intervention:</p>
            <pre>${transferDetails}</pre>
            <p>Please review these transfers in the admin dashboard and take appropriate action.</p>
          `
        }
      }
    );
    
    if (emailError) {
      console.error('[TRANSFER-PROCESSOR] Error sending admin notification:', emailError);
      throw emailError;
    }
    
    console.log('[TRANSFER-PROCESSOR] Admin notification sent successfully');
    
    // Mark notified transfers as permanently failed to prevent future notifications
    const { error: updateError } = await supabase
      .from('pending_transfers')
      .update({ status: 'failed_permanent' })
      .in('id', failedTransfers.map(t => t.id));
    
    if (updateError) {
      console.error('[TRANSFER-PROCESSOR] Error updating failed transfer status:', updateError);
      throw updateError;
    }
    
    return 1; // One notification sent
    
  } catch (error: any) {
    console.error('[TRANSFER-PROCESSOR] Error in sendAdminNotifications:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[TRANSFER-PROCESSOR] Starting transfer processing batch...');
  
  const results: ProcessingResult = {
    newTransfersProcessed: 0,
    retriesProcessed: 0,
    adminNotificationsSent: 0,
    errors: []
  };

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Initialize Stripe client
    const stripeMode = getStripeMode();
    const stripeKey = getStripeKey(stripeMode);
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    
    console.log(`[TRANSFER-PROCESSOR] Initialized with Stripe ${stripeMode} mode`);

    // Process new transfers
    try {
      results.newTransfersProcessed = await processNewTransfers(supabase, stripe, stripeMode);
    } catch (error: any) {
      console.error('[TRANSFER-PROCESSOR] Error processing new transfers:', error);
      results.errors.push(`New transfers: ${error.message}`);
    }

    // Process retries
    try {
      results.retriesProcessed = await processRetries(supabase, stripe, stripeMode);
    } catch (error: any) {
      console.error('[TRANSFER-PROCESSOR] Error processing retries:', error);
      results.errors.push(`Retries: ${error.message}`);
    }

    // Send admin notifications
    try {
      results.adminNotificationsSent = await sendAdminNotifications(supabase);
    } catch (error: any) {
      console.error('[TRANSFER-PROCESSOR] Error sending notifications:', error);
      results.errors.push(`Notifications: ${error.message}`);
    }

    console.log('[TRANSFER-PROCESSOR] Processing batch completed:', results);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('[TRANSFER-PROCESSOR] Fatal error in transfer processing:', error);
    results.errors.push(`Fatal error: ${error.message}`);
    
    return new Response(JSON.stringify(results), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
});