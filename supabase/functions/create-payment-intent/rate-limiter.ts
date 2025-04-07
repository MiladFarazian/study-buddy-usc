
// Rate limiting implementation
const RATE_LIMIT_WINDOW = 60000; // 1 minute window
const RATE_LIMIT_MAX = 10; // Maximum requests per client per minute
const requestCache = new Map<string, {count: number, timestamp: number}>();

// Clean up old entries in the rate limit cache every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestCache.entries()) {
    if (now - data.timestamp > RATE_LIMIT_WINDOW * 2) {
      requestCache.delete(key);
    }
  }
}, 300000); // 5 minutes

export class RateLimiter {
  checkRateLimit(req: Request, sessionId: string, studentId: string) {
    // Better rate limiting - use more client parameters for better fingerprinting
    const clientIp = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const clientHash = `${clientIp}-${userAgent.substring(0, 20)}`.replace(/[^a-zA-Z0-9-]/g, '');
    const requestKey = `${sessionId}_${studentId}_${clientHash}`;

    // Check for rate limiting with a more unique key
    const now = Date.now();
    const cachedRequest = requestCache.get(requestKey);
    
    // Initialize or update rate limit tracking
    if (!cachedRequest) {
      requestCache.set(requestKey, { count: 1, timestamp: now });
      return { isLimited: false, requestKey, count: 1 };
    } else {
      // If window has expired, reset counter
      if (now - cachedRequest.timestamp > RATE_LIMIT_WINDOW) {
        requestCache.set(requestKey, { count: 1, timestamp: now });
        return { isLimited: false, requestKey, count: 1 };
      } else {
        // Increment counter
        cachedRequest.count++;
        
        // Check if limit is exceeded
        if (cachedRequest.count > RATE_LIMIT_MAX) {
          // Calculate retry-after time in seconds
          const retryAfter = Math.ceil((RATE_LIMIT_WINDOW - (now - cachedRequest.timestamp)) / 1000);
          return { 
            isLimited: true, 
            requestKey, 
            count: cachedRequest.count,
            retryAfter
          };
        }
        
        return { isLimited: false, requestKey, count: cachedRequest.count };
      }
    }
  }
}
