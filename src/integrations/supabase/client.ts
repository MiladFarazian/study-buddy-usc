
// The URL and publishable key below are generated. Do not edit them by hand.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://fzcyzjruixuriqzryppz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6Y3l6anJ1aXh1cmlxenJ5cHB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5ODA5NTcsImV4cCI6MjA1NzU1Njk1N30.roxqC5QR4cIYpdLzwr20p_3ZVElpR9CUCJTOg_AuBhc";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: localStorage,
      // Authorization code + PKCE (RFC 7636) rather than the implicit flow.
      //
      // Implicit returns the access token in the URL fragment, where it lands
      // in browser history, gets read by any script on the page, and can leak
      // through a Referer header. PKCE returns a single-use code that is
      // worthless without the verifier held in this tab, and it is what makes
      // SAML SSO work here — see src/lib/auth/sso.ts.
      //
      // Requires /auth/callback to call exchangeCodeForSession; see
      // src/pages/AuthCallback.tsx.
      flowType: 'pkce',
    }
  }
);
