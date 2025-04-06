
import { useRef } from 'react';

/**
 * Custom hook to handle rate limiting for API requests
 */
export function useRateLimiting() {
  // Use ref to prevent multiple simultaneous requests
  const requestInProgress = useRef<boolean>(false);
  
  // Track the last session ID to avoid duplicate requests
  const lastSessionId = useRef<string | null>(null);
  
  // Track the timestamp of the last request to implement client-side rate limiting
  const lastRequestTime = useRef<number>(0);
  const MIN_REQUEST_INTERVAL = 5000; // 5 seconds minimum between requests
  
  const checkRateLimit = (sessionId: string): { 
    canProceed: boolean; 
    isDuplicate: boolean;
    timeSinceLastRequest: number;
  } => {
    // First check for too frequent requests (client-side rate limiting)
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;
    
    // Check if this is a duplicate request for the same session
    const isDuplicate = sessionId === lastSessionId.current;
    
    // Prevent multiple simultaneous requests
    const canProceed = !requestInProgress.current && timeSinceLastRequest >= MIN_REQUEST_INTERVAL;
    
    return { canProceed, isDuplicate, timeSinceLastRequest };
  };
  
  const startRequest = (sessionId: string) => {
    requestInProgress.current = true;
    lastRequestTime.current = Date.now();
    lastSessionId.current = sessionId;
  };
  
  const endRequest = () => {
    requestInProgress.current = false;
  };
  
  const resetLimiting = () => {
    requestInProgress.current = false;
    lastSessionId.current = null;
    lastRequestTime.current = 0;
  };
  
  return {
    checkRateLimit,
    startRequest,
    endRequest,
    resetLimiting,
    isRequestInProgress: () => requestInProgress.current,
    getLastSessionId: () => lastSessionId.current
  };
}
