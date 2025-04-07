
// Environment detection logic
export async function determineEnvironment(req: Request, requestBody: any) {
  // Multiple methods for determining environment
  // 1. Check for x-use-production header 
  const useProductionHeader = req.headers.get('x-use-production');
  console.log(`x-use-production header: ${useProductionHeader}`);
  
  // 2. Check URL hostname
  const url = new URL(req.url);
  const hostname = url.hostname || '';
  console.log(`Request hostname: ${hostname}`);
  
  // 3. Check environment variable
  const envFlag = Deno.env.get('USE_PRODUCTION_STRIPE');
  console.log(`USE_PRODUCTION_STRIPE env: ${envFlag}`);
  
  // 4. Check if isProduction was passed in the request body
  console.log(`Request body isProduction: ${requestBody.isProduction}`);
  
  // Determine if we should use production keys with multiple fallbacks
  const isProduction = 
    useProductionHeader === 'true' || 
    requestBody.isProduction === true ||
    envFlag === 'true' ||
    hostname.includes('studybuddyusc.com') || 
    hostname.includes('netlify') ||
    hostname.includes('vercel');
  
  const environmentDecision = `${isProduction ? 'PRODUCTION' : 'TEST'} mode`;
  console.log(`Decision factors: Header=${useProductionHeader}, Body=${requestBody.isProduction}, Hostname=${hostname}, Env=${envFlag}`);
  
  // Check if Stripe secret key is configured
  const stripeSecretKey = isProduction 
    ? Deno.env.get('STRIPE_CONNECT_LIVE_SECRET_KEY')
    : Deno.env.get('STRIPE_CONNECT_SECRET_KEY');
    
  return { isProduction, stripeSecretKey, environmentDecision };
}
