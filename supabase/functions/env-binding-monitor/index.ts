// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Long-running monitoring to detect environment variable binding issues
declare global {
  var bindingMonitor: {
    startTime: number;
    instanceId: string;
    secretChecks: Array<{
      timestamp: number;
      uptimeMinutes: number;
      secretExists: boolean;
      secretLength: number;
      allStripeKeys: string[];
      environmentHash: string;
    }>;
  };
}

const TARGET_SECRET = 'STRIPE_CONNECT_SECRET_KEY';

const performBindingCheck = () => {
  const currentTime = Date.now();
  
  if (!globalThis.bindingMonitor) {
    globalThis.bindingMonitor = {
      startTime: currentTime,
      instanceId: Math.random().toString(36).substring(7),
      secretChecks: []
    };
    console.log('🔍 BINDING_MONITOR: Initialized', {
      instanceId: globalThis.bindingMonitor.instanceId,
      targetSecret: TARGET_SECRET
    });
  }

  const uptimeMs = currentTime - globalThis.bindingMonitor.startTime;
  const uptimeMinutes = Math.round(uptimeMs / 60000);

  // Get current environment state
  const secretValue = Deno.env.get(TARGET_SECRET);
  const secretExists = !!secretValue;
  const secretLength = secretValue?.length || 0;
  
  const allEnvKeys = Object.keys(Deno.env.toObject());
  const allStripeKeys = allEnvKeys.filter(k => k.includes('STRIPE')).sort();
  
  // Create a hash of the current environment for change detection
  const environmentHash = btoa(JSON.stringify({
    stripeKeyCount: allStripeKeys.length,
    targetSecretExists: secretExists,
    keys: allStripeKeys
  }));

  const checkResult = {
    timestamp: currentTime,
    uptimeMinutes,
    secretExists,
    secretLength,
    allStripeKeys,
    environmentHash
  };

  globalThis.bindingMonitor.secretChecks.push(checkResult);

  // Analyze patterns if we have enough data
  const checks = globalThis.bindingMonitor.secretChecks;
  if (checks.length > 1) {
    const previousCheck = checks[checks.length - 2];
    
    // Detect secret availability changes
    if (previousCheck.secretExists !== secretExists) {
      const changeType = secretExists ? 'RECOVERY' : 'DEGRADATION';
      console.log(`🚨 SECRET_${changeType}:`, {
        targetSecret: TARGET_SECRET,
        from: previousCheck.secretExists ? 'AVAILABLE' : 'MISSING',
        to: secretExists ? 'AVAILABLE' : 'MISSING',
        atUptimeMinutes: uptimeMinutes,
        timeSinceLastCheck: Math.round((currentTime - previousCheck.timestamp) / 1000) + 's'
      });
    }
    
    // Detect environment hash changes (wholesale environment changes)
    if (previousCheck.environmentHash !== environmentHash) {
      console.log('🔄 ENVIRONMENT_CHANGE:', {
        uptimeMinutes,
        previousKeyCount: previousCheck.allStripeKeys.length,
        currentKeyCount: allStripeKeys.length,
        addedKeys: allStripeKeys.filter(k => !previousCheck.allStripeKeys.includes(k)),
        removedKeys: previousCheck.allStripeKeys.filter(k => !allStripeKeys.includes(k))
      });
    }
  }

  // Keep only last 100 checks to prevent memory issues
  if (checks.length > 100) {
    globalThis.bindingMonitor.secretChecks = checks.slice(-100);
  }

  return {
    instanceId: globalThis.bindingMonitor.instanceId,
    uptimeMinutes,
    totalChecks: checks.length,
    currentState: checkResult,
    analysis: {
      secretNeverAvailable: checks.every(c => !c.secretExists),
      secretAlwaysAvailable: checks.every(c => c.secretExists),
      hasFluctuated: checks.some(c => c.secretExists) && checks.some(c => !c.secretExists),
      degradationEvents: checks.filter((c, i) => {
        const prev = checks[i - 1];
        return prev && prev.secretExists && !c.secretExists;
      }).length,
      recoveryEvents: checks.filter((c, i) => {
        const prev = checks[i - 1];
        return prev && !prev.secretExists && c.secretExists;
      }).length
    }
  };
};

serve(async (req) => {
  console.log('🔍 ENV_BINDING_MONITOR: Check initiated');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const monitoringResult = performBindingCheck();
    
    // Log critical findings
    if (!monitoringResult.currentState.secretExists) {
      console.error('🚨 CRITICAL_BINDING_ISSUE:', {
        targetSecret: TARGET_SECRET,
        status: 'MISSING',
        uptimeMinutes: monitoringResult.uptimeMinutes,
        totalChecks: monitoringResult.totalChecks,
        neverWorked: monitoringResult.analysis.secretNeverAvailable
      });
    }

    if (monitoringResult.analysis.hasFluctuated) {
      console.warn('⚠️ UNSTABLE_BINDING:', {
        degradations: monitoringResult.analysis.degradationEvents,
        recoveries: monitoringResult.analysis.recoveryEvents,
        currentlyWorking: monitoringResult.currentState.secretExists
      });
    }

    // Detailed analysis for response
    const response = {
      summary: {
        targetSecret: TARGET_SECRET,
        currentlyAvailable: monitoringResult.currentState.secretExists,
        functionUptime: `${monitoringResult.uptimeMinutes} minutes`,
        totalChecks: monitoringResult.totalChecks,
        bindingStability: monitoringResult.analysis.secretAlwaysAvailable ? 'STABLE' :
                         monitoringResult.analysis.secretNeverAvailable ? 'NEVER_BOUND' :
                         'UNSTABLE'
      },
      
      currentEnvironment: {
        secretLength: monitoringResult.currentState.secretLength,
        stripeKeysCount: monitoringResult.currentState.allStripeKeys.length,
        allStripeKeys: monitoringResult.currentState.allStripeKeys,
        missingTargetKey: !monitoringResult.currentState.allStripeKeys.includes(TARGET_SECRET)
      },
      
      historicalAnalysis: monitoringResult.analysis,
      
      troubleshooting: {
        suspectedCause: monitoringResult.analysis.secretNeverAvailable 
          ? 'Environment variable never properly bound to this function'
          : monitoringResult.analysis.hasFluctuated
          ? 'Intermittent binding issue - environment variable becomes unbound over time'
          : 'Monitoring in progress',
          
        recommendations: [
          monitoringResult.analysis.secretNeverAvailable 
            ? 'Verify secret exists in Supabase secrets panel'
            : 'Continue monitoring to identify degradation pattern',
          'Check if other functions have the same issue',
          'Compare with working environment variables (STRIPE_CONNECT_LIVE_SECRET_KEY)',
          'Consider redeploying functions to force environment refresh'
        ]
      }
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 MONITOR_ERROR:', error);
    
    return new Response(JSON.stringify({
      error: 'Monitoring failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
