
// This file is automatically generated. Do not edit it directly.
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
      redirectTo: 'https://preview--academic-help-hub.lovable.app/'
    }
  }
);
