
import { useRef, useCallback } from 'react';

/**
 * Hook for client-side rate limiting to prevent duplicate requests
 */
export function useRateLimiter(minInterval = 3000) {
  // Track if payment setup is in progress to prevent duplicate attempts
  const isInProgress = useRef(false);
  const lastAttemptTime = useRef(0);
  
  /**
   * Check if the request is being rate limited
   */
  const isLimited = useCallback(() => {
    const now = Date.now();
    const timeSinceLastAttempt = now - lastAttemptTime.current;
    
    if (timeSinceLastAttempt < minInterval) {
      console.log(`Attempt too soon after previous attempt (${timeSinceLastAttempt}ms). Please wait a moment.`);
      return true;
    }
    return false;
  }, [minInterval]);
  
  /**
   * Mark an attempt as occurring now
   */
  const markAttempt = useCallback(() => {
    lastAttemptTime.current = Date.now();
  }, []);
  
  /**
   * Check if setup is already in progress
   */
  const setupInProgress = useCallback(() => {
    return isInProgress.current;
  }, []);
  
  /**
   * Set the in-progress state
   */
  const setInProgress = useCallback((state: boolean) => {
    isInProgress.current = state;
  }, []);
  
  /**
   * Reset the rate limiter state
   */
  const resetLimiter = useCallback(() => {
    isInProgress.current = false;
    lastAttemptTime.current = 0;
  }, []);
  
  return {
    isLimited,
    markAttempt,
    setupInProgress,
    setInProgress,
    resetLimiter
  };
}
