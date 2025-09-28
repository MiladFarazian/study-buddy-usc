import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Global tracking for environment variable stability
declare global {
  var envTracker: {
    functionInstanceId: string;
    startTime: number;
    initialSecretStates: Record<string, boolean>;
    checkCount: number;
    lastCheck: number;
    degradationEvents: Array<{
      timestamp: number;
      secretName: string;
      previousState: boolean;
      newState: boolean;
    }>;
  };
}

const STRIPE_SECRETS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY', 
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_CONNECT_SECRET_KEY',  // Problem variable
  'STRIPE_LIVE_PUBLISHABLE_KEY',
  'STRIPE_LIVE_WEBHOOK_SECRET',
  'STRIPE_CONNECT_LIVE_SECRET_KEY',
  'STRIPE_MODE'
];

const checkEnvironmentStability = () => {
  const currentTime = Date.now();
  const currentStates: Record<string, boolean> = {};
  
  // Check current state of all Stripe secrets
  STRIPE_SECRETS.forEach(secret => {
    const value = Deno.env.get(secret);
    currentStates[secret] = !!value && value.length > 0;
  });

  // Initialize tracker if first run
  if (!globalThis.envTracker) {
    globalThis.envTracker = {
      functionInstanceId: Math.random().toString(36).substring(7),
      startTime: currentTime,
      initialSecretStates: { ...currentStates },
      checkCount: 0,
      lastCheck: currentTime,
      degradationEvents: []
    };
    console.log('🔍 ENV_TRACKER: Initialized monitoring', {
      instanceId: globalThis.envTracker.functionInstanceId,
      initialStates: currentStates
    });
  }

  // Track changes from previous check
  if (globalThis.envTracker.checkCount > 0) {
    STRIPE_SECRETS.forEach(secret => {
      const wasAvailable = globalThis.envTracker.initialSecretStates[secret];
      const isAvailable = currentStates[secret];
      
      if (wasAvailable !== isAvailable) {
        const event = {
          timestamp: currentTime,
          secretName: secret,
          previousState: wasAvailable,
          newState: isAvailable
        };
        globalThis.envTracker.degradationEvents.push(event);
        
        console.log('⚠️ ENV_DEGRADATION:', {
          secret,
          change: `${wasAvailable ? 'AVAILABLE' : 'MISSING'} → ${isAvailable ? 'AVAILABLE' : 'MISSING'}`,
          timeSinceStart: Math.round((currentTime - globalThis.envTracker.startTime) / 60000),
          checkCount: globalThis.envTracker.checkCount
        });
      }
    });
  }

  globalThis.envTracker.checkCount++;
  globalThis.envTracker.lastCheck = currentTime;

  return {
    instanceId: globalThis.envTracker.functionInstanceId,
    uptime: currentTime - globalThis.envTracker.startTime,
    uptimeMinutes: Math.round((currentTime - globalThis.envTracker.startTime) / 60000),
    checkCount: globalThis.envTracker.checkCount,
    currentStates,
    initialStates: globalThis.envTracker.initialSecretStates,
    degradationEvents: globalThis.envTracker.degradationEvents,
    criticalIssue: !currentStates.STRIPE_CONNECT_SECRET_KEY
  };
};

const performDeepDiagnostics = () => {
  console.log('🔬 DEEP_DIAGNOSTICS: Starting comprehensive analysis...');
  
  // Check environment variable characteristics
  const stripeConnectSecret = Deno.env.get('STRIPE_CONNECT_SECRET_KEY');
  const stripeConnectLiveSecret = Deno.env.get('STRIPE_CONNECT_LIVE_SECRET_KEY');
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    
    // Basic availability
    stripeConnectSecret: {
      exists: !!stripeConnectSecret,
      length: stripeConnectSecret?.length || 0,
      type: typeof stripeConnectSecret,
      isEmptyString: stripeConnectSecret === '',
      isUndefined: stripeConnectSecret === undefined,
      isNull: stripeConnectSecret === null
    },
    
    // Compare with working variable
    stripeConnectLiveSecret: {
      exists: !!stripeConnectLiveSecret,
      length: stripeConnectLiveSecret?.length || 0,
      type: typeof stripeConnectLiveSecret
    },
    
    // Environment analysis
    environment: {
      totalEnvVars: Object.keys(Deno.env.toObject()).length,
      stripeVarCount: Object.keys(Deno.env.toObject()).filter(k => k.includes('STRIPE')).length,
      allStripeVars: Object.keys(Deno.env.toObject()).filter(k => k.includes('STRIPE'))
    },
    
    // System information
    system: {
      denoVersion: Deno.version.deno,
      platform: Deno.build.os,
      arch: Deno.build.arch
    }
  };
  
  console.log('🔬 DIAGNOSTICS_RESULT:', JSON.stringify(diagnostics, null, 2));
  
  return diagnostics;
};

serve(async (req) => {
  console.log('🩺 STRIPE_ENV_DIAGNOSTICS: Function invoked');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Perform stability check
    const stabilityReport = checkEnvironmentStability();
    
    // Perform deep diagnostics
    const deepDiagnostics = performDeepDiagnostics();
    
    // Generate comprehensive report
    const report = {
      summary: {
        criticalIssue: stabilityReport.criticalIssue,
        issueDescription: stabilityReport.criticalIssue 
          ? 'STRIPE_CONNECT_SECRET_KEY is missing from environment'
          : 'All environment variables are accessible',
        functionUptime: `${stabilityReport.uptimeMinutes} minutes`,
        totalChecks: stabilityReport.checkCount
      },
      
      stability: stabilityReport,
      diagnostics: deepDiagnostics,
      
      // Specific analysis for STRIPE_CONNECT_SECRET_KEY
      secretAnalysis: {
        targetSecret: 'STRIPE_CONNECT_SECRET_KEY',
        currentStatus: stabilityReport.currentStates.STRIPE_CONNECT_SECRET_KEY ? 'ACCESSIBLE' : 'MISSING',
        initialStatus: stabilityReport.initialStates.STRIPE_CONNECT_SECRET_KEY ? 'ACCESSIBLE' : 'MISSING',
        hasChanged: stabilityReport.initialStates.STRIPE_CONNECT_SECRET_KEY !== stabilityReport.currentStates.STRIPE_CONNECT_SECRET_KEY,
        degradationEvents: stabilityReport.degradationEvents.filter(e => e.secretName === 'STRIPE_CONNECT_SECRET_KEY')
      },
      
      // Comparison with working secrets
      comparison: {
        workingSecrets: STRIPE_SECRETS.filter(s => stabilityReport.currentStates[s]),
        missingSecrets: STRIPE_SECRETS.filter(s => !stabilityReport.currentStates[s]),
        liveSecretWorking: stabilityReport.currentStates.STRIPE_CONNECT_LIVE_SECRET_KEY,
        testSecretWorking: stabilityReport.currentStates.STRIPE_CONNECT_SECRET_KEY
      }
    };
    
    // Log critical findings
    if (stabilityReport.criticalIssue) {
      console.error('🚨 CRITICAL: STRIPE_CONNECT_SECRET_KEY is not accessible');
      console.log('🔍 WORKING_SECRETS:', report.comparison.workingSecrets);
      console.log('❌ MISSING_SECRETS:', report.comparison.missingSecrets);
    }
    
    if (stabilityReport.degradationEvents.length > 0) {
      console.warn('📉 DEGRADATION_EVENTS:', stabilityReport.degradationEvents);
    }

    return new Response(JSON.stringify(report, null, 2), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('💥 DIAGNOSTICS_ERROR:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Diagnostics failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});