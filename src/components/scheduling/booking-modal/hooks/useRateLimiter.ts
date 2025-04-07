
import { useRef, useCallback, useState, useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Enhanced hook for client-side rate limiting to prevent duplicate requests
 */
export function useRateLimiter(minInterval = 3000, maxAttempts = 3, cooldownPeriod = 10000) {
  // Track if payment setup is in progress to prevent duplicate attempts
  const isInProgress = useRef(false);
  const lastAttemptTime = useRef(0);
  const attemptCount = useRef(0);
  const cooldownTimer = useRef<number | null>(null);
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  
  // Reset counters when component unmounts or after cooldown period
  useEffect(() => {
    return () => {
      if (cooldownTimer.current) {
        window.clearTimeout(cooldownTimer.current);
      }
    };
  }, []);
  
  /**
   * Start cooldown period after too many attempts
   */
  const startCooldown = useCallback(() => {
    setIsCoolingDown(true);
    toast.warning(`Too many requests. Please wait ${cooldownPeriod/1000} seconds before trying again.`);
    
    if (cooldownTimer.current) {
      window.clearTimeout(cooldownTimer.current);
    }
    
    cooldownTimer.current = window.setTimeout(() => {
      attemptCount.current = 0;
      setIsCoolingDown(false);
      lastAttemptTime.current = 0;
      toast.info("You can try again now");
    }, cooldownPeriod);
  }, [cooldownPeriod]);
  
  /**
   * Check if the request is being rate limited
   */
  const isLimited = useCallback(() => {
    // If in cooldown mode, prevent all requests
    if (isCoolingDown) {
      console.log("Currently in cooldown period. Please wait.");
      return true;
    }
    
    const now = Date.now();
    const timeSinceLastAttempt = now - lastAttemptTime.current;
    
    if (timeSinceLastAttempt < minInterval) {
      console.log(`Attempt too soon after previous attempt (${timeSinceLastAttempt}ms). Please wait a moment.`);
      
      // Increment attempt counter for rapid consecutive attempts
      attemptCount.current++;
      
      // If too many attempts in short succession, start cooldown
      if (attemptCount.current >= maxAttempts) {
        startCooldown();
      } else {
        toast.warning("Please slow down and wait between attempts");
      }
      
      return true;
    }
    
    return false;
  }, [minInterval, maxAttempts, isCoolingDown, startCooldown]);
  
  /**
   * Mark an attempt as occurring now
   */
  const markAttempt = useCallback(() => {
    lastAttemptTime.current = Date.now();
    attemptCount.current++;
    
    // If we've reached max attempts, start cooldown
    if (attemptCount.current >= maxAttempts) {
      startCooldown();
    }
  }, [maxAttempts, startCooldown]);
  
  /**
   * Check if setup is already in progress
   */
  const setupInProgress = useCallback(() => {
    if (isInProgress.current) {
      toast.warning("A request is already in progress");
      return true;
    }
    return false;
  }, []);
  
  /**
   * Set the in-progress state
   */
  const setInProgress = useCallback((state: boolean) => {
    isInProgress.current = state;
    
    // Reset attempt count when a process completes successfully
    if (state === false && attemptCount.current > 0) {
      attemptCount.current = 0;
    }
  }, []);
  
  /**
   * Reset the rate limiter state
   */
  const resetLimiter = useCallback(() => {
    isInProgress.current = false;
    lastAttemptTime.current = 0;
    attemptCount.current = 0;
    setIsCoolingDown(false);
    
    if (cooldownTimer.current) {
      window.clearTimeout(cooldownTimer.current);
      cooldownTimer.current = null;
    }
  }, []);
  
  return {
    isLimited,
    markAttempt,
    setupInProgress,
    setInProgress,
    resetLimiter,
    isCoolingDown
  };
}
