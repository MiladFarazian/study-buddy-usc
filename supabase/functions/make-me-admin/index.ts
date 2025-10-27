import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Edge function to promote the current user to admin
 * 
 * SECURITY: This function only works if:
 * 1. No admin users currently exist (initial setup only)
 * 2. User is authenticated
 * 
 * After the first admin is created, this function will refuse to create more admins.
 * Additional admins must be added manually via SQL or by existing admins.
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authenticated user from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract JWT token
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the user's JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY CHECK: Verify no admins exist yet
    const { data: existingAdmins, error: checkError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (checkError) {
      console.error('Error checking for existing admins:', checkError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify admin status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If admins already exist, refuse to create another
    if (existingAdmins && existingAdmins.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Admin users already exist. Additional admins must be added manually by existing admins.',
          message: 'For security reasons, this function only works for initial setup when no admins exist yet.'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // No admins exist, so we can safely promote this user
    const { data: newAdmin, error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: 'admin'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating admin user:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create admin user', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile for response
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', user.id)
      .single();

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Successfully promoted to admin',
        admin: {
          user_id: user.id,
          email: profile?.email || user.email,
          name: profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'Admin User'
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});