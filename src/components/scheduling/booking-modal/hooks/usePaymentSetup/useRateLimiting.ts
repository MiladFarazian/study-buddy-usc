
import { useRef, useCallback } from 'react';
import { toast } from 'sonner';

// Track global rate limiting state across hook instances
const globalRateLimitState = {
  lastRequestTime: 0,
  requestCount: 0,
  activeSessionId: null as string | null,
  isProcessing: false,
  isRateLimited: false,
  rateLimitExpiry: 0,
};

/**
 * Hook for specialized payment rate limiting
 */
export function useRateLimiting(
  maxRequests = 3, 
  timeWindow = 60000, // 1 minute
  minInterval = 2000   // Minimum time between requests
) {
  const lastSessionId = useRef<string | null>(null);
  
  /**
   * Check if a request is rate limited
   */
  const checkRateLimit = useCallback((sessionId: string) => {
    const now = Date.now();
    const timeSinceLastRequest = now - globalRateLimitState.lastRequestTime;
    
    // If we're already processing this session
    const isDuplicate = sessionId === globalRateLimitState.activeSessionId;
    
    // Check if we're in a rate-limited state
    if (globalRateLimitState.isRateLimited && now < globalRateLimitState.rateLimitExpiry) {
      toast.error(`Rate limited. Please try again in ${Math.ceil((globalRateLimitState.rateLimitExpiry - now) / 1000)} seconds`);
      return { canProceed: false, isDuplicate, timeSinceLastRequest };
    }
    
    // If the request is too close to the previous one
    if (timeSinceLastRequest < minInterval) {
      globalRateLimitState.requestCount++;
      
      // If too many requests in the time window
      if (globalRateLimitState.requestCount > maxRequests) {
        globalRateLimitState.isRateLimited = true;
        globalRateLimitState.rateLimitExpiry = now + 20000; // 20 sec cooldown
        toast.error('Too many requests. Cooling down for 20 seconds.');
        
        // Reset count after cooldown
        setTimeout(() => {
          globalRateLimitState.requestCount = 0;
          globalRateLimitState.isRateLimited = false;
        }, 20000);
        
        return { canProceed: false, isDuplicate, timeSinceLastRequest };
      }
      
      if (!isDuplicate) {
        toast.warning('Please wait between requests');
      }
      return { canProceed: false, isDuplicate, timeSinceLastRequest };
    }
    
    // If already processing, don't allow another request
    if (globalRateLimitState.isProcessing && !isDuplicate) {
      toast.warning('A payment request is already being processed');
      return { canProceed: false, isDuplicate, timeSinceLastRequest };
    }
    
    // All checks passed, can proceed
    return { canProceed: true, isDuplicate, timeSinceLastRequest };
  }, [minInterval, maxRequests]);
  
  /**
   * Start tracking a request
   */
  const startRequest = useCallback((sessionId: string) => {
    const now = Date.now();
    globalRateLimitState.lastRequestTime = now;
    globalRateLimitState.activeSessionId = sessionId;
    globalRateLimitState.isProcessing = true;
    lastSessionId.current = sessionId;
  }, []);
  
  /**
   * End request tracking
   */
  const endRequest = useCallback(() => {
    globalRateLimitState.isProcessing = false;
  }, []);
  
  /**
   * Reset the rate limiting state
   */
  const resetLimiting = useCallback(() => {
    globalRateLimitState.requestCount = 0;
    globalRateLimitState.isProcessing = false;
    globalRateLimitState.isRateLimited = false;
    globalRateLimitState.activeSessionId = null;
  }, []);
  
  /**
   * Get the last session ID that was processed
   */
  const getLastSessionId = useCallback(() => {
    return lastSessionId.current;
  }, []);
  
  return { 
    checkRateLimit,
    startRequest,
    endRequest,
    resetLimiting,
    getLastSessionId
  };
}
