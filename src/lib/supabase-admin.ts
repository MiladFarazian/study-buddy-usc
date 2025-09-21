import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = "https://fzcyzjruixuriqzryppz.supabase.co";

// For development, using service role key directly
// In production, this would be an environment variable
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6Y3l6anJ1aXh1cmlxenJ5cHB6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTk4MDk1NywiZXhwIjoyMDU3NTU2OTU3fQ.a_BZhUh3U8GwKDJlJOuHNDzEqfhSaBh4Wy_LGhGXBl8";

// Admin client with service role for full database access
export const supabaseAdmin = createClient<Database>(
  SUPABASE_URL,
  SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);