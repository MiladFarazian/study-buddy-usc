
import { useState, useCallback, useRef } from 'react';

interface LastRequestTime {
  [key: string]: number;
}

export function useRateLimiter(actionKey: string = 'default', cooldownMs: number = 1000) {
  const lastRequestTimeRef = useRef<LastRequestTime>({});

  const isRateLimited = useCallback(() => {
    const now = Date.now();
    const lastRequest = lastRequestTimeRef.current[actionKey] || 0;
    return now - lastRequest < cooldownMs;
  }, [actionKey, cooldownMs]);

  const trackRequest = useCallback(() => {
    lastRequestTimeRef.current[actionKey] = Date.now();
  }, [actionKey]);

  return { isRateLimited, trackRequest };
}
