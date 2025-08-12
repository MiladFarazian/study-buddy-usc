import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Admin client (service role)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  session_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id }: RequestBody = await req.json();
    if (!session_id) {
      return new Response(JSON.stringify({ success: false, error: 'session_id is required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // Fetch session details (service role bypasses RLS)
    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select('id, session_type, zoom_meeting_id, status')
      .eq('id', session_id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!session) return new Response(JSON.stringify({ success: false, error: 'Session not found' }), { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } });

    console.log('[cancel-session] Cancelling session', session_id, 'current status:', session.status, 'type:', session.session_type, 'zoom:', !!session.zoom_meeting_id);

    // Try to delete Zoom meeting if present (best effort)
    if ((session.session_type === 'virtual' || session.session_type === 'VIRTUAL') && session.zoom_meeting_id) {
      try {
        await supabase.functions.invoke('delete-zoom-meeting', { body: { meeting_id: session.zoom_meeting_id } });
      } catch (e) {
        console.error('[cancel-session] Zoom deletion error:', e);
      }
    }

    // Update session to cancelled and clear Zoom fields
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        status: 'cancelled',
        zoom_meeting_id: null,
        zoom_join_url: null,
        zoom_start_url: null,
        zoom_password: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session_id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (error: any) {
    console.error('[cancel-session] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message || 'Unknown error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});
