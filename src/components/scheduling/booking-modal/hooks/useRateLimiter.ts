
import { useState, useCallback, useRef } from 'react';

interface LastRequestTime {
  [key: string]: number;
}

interface RateLimiterState {
  requestCount: number;
  lastRequestTime: number;
  inProgress: boolean;
  coolingDown: boolean;
}

export function useRateLimiter(cooldownMs: number = 1000, maxAttempts: number = 5, penaltyCooldownMs: number = 5000) {
  const [state, setState] = useState<RateLimiterState>({
    requestCount: 0,
    lastRequestTime: 0,
    inProgress: false,
    coolingDown: false
  });
  const lastRequestTimeRef = useRef<LastRequestTime>({});
  const actionKey = 'default';

  // Check if we should rate limit based on time between requests
  const isRateLimited = useCallback(() => {
    const now = Date.now();
    const lastRequest = lastRequestTimeRef.current[actionKey] || 0;
    return now - lastRequest < cooldownMs;
  }, [cooldownMs]);

  // Track a new request
  const trackRequest = useCallback(() => {
    lastRequestTimeRef.current[actionKey] = Date.now();
  }, []);

  // Check if we've reached the maximum number of attempts
  const isLimited = useCallback(() => {
    return state.requestCount >= maxAttempts || isRateLimited();
  }, [state.requestCount, maxAttempts, isRateLimited]);

  // Mark an attempt (increases counter)
  const markAttempt = useCallback(() => {
    setState(prev => ({
      ...prev,
      requestCount: prev.requestCount + 1,
      lastRequestTime: Date.now()
    }));
    trackRequest();

    // If we've reached max attempts, enter cooling down period
    if (state.requestCount >= maxAttempts - 1) {
      setState(prev => ({ ...prev, coolingDown: true }));
      
      // Reset after penalty period
      setTimeout(() => {
        setState({
          requestCount: 0,
          lastRequestTime: 0,
          inProgress: false,
          coolingDown: false
        });
      }, penaltyCooldownMs);
    }
  }, [state.requestCount, maxAttempts, penaltyCooldownMs, trackRequest]);

  // Check if request is in progress
  const setupInProgress = useCallback(() => {
    return state.inProgress;
  }, [state.inProgress]);

  // Set in-progress state
  const setInProgress = useCallback((value: boolean) => {
    setState(prev => ({ ...prev, inProgress: value }));
  }, []);

  // Reset the rate limiter
  const resetLimiter = useCallback(() => {
    setState({
      requestCount: 0,
      lastRequestTime: 0,
      inProgress: false,
      coolingDown: false
    });
  }, []);

  // Return combined API
  return {
    // Original API
    isRateLimited,
    trackRequest,
    
    // Enhanced API
    isLimited,
    markAttempt,
    setupInProgress,
    setInProgress,
    resetLimiter,
    isCoolingDown: state.coolingDown
  };
}
