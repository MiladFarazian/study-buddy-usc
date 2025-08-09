import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getAccessToken(): Promise<string> {
  const accountId = Deno.env.get("ZOOM_ACCOUNT_ID");
  const clientId = Deno.env.get("ZOOM_API_KEY");
  const clientSecret = Deno.env.get("ZOOM_API_SECRET");
  if (!accountId || !clientId || !clientSecret) {
    throw new Error("Missing Zoom credentials (ZOOM_ACCOUNT_ID, ZOOM_API_KEY, ZOOM_API_SECRET)");
  }
  const auth = btoa(`${clientId}:${clientSecret}`);
  const url = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(url, { method: "POST", headers: { Authorization: `Basic ${auth}` }, signal: controller.signal });
    if (!res.ok) {
      const t = await res.text();
      console.error("Zoom token fetch failed:", res.status, t);
      throw new Error(`Token fetch failed (${res.status})`);
    }
    const { access_token } = await res.json();
    return access_token;
  } finally { clearTimeout(timeout); }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const meetingId = body.meeting_id || body.meetingId;
    if (!meetingId) {
      return new Response(JSON.stringify({ error: "meeting_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const token = await getAccessToken();
    const url = `https://api.zoom.us/v2/meetings/${encodeURIComponent(meetingId)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const res = await fetch(url, { method: "DELETE", headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
      if (!res.ok && res.status !== 204) {
        const t = await res.text();
        console.error("delete-zoom-meeting failed:", res.status, t);
        return new Response(JSON.stringify({ id: meetingId, join_url: null, start_url: null, password: null, status: null, error: `Zoom error ${res.status}` }), { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ id: meetingId, join_url: null, start_url: null, password: null, status: "deleted", error: null }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } finally {
      clearTimeout(timeout);
    }
  } catch (e) {
    console.error("delete-zoom-meeting error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ id: null, join_url: null, start_url: null, password: null, status: null, error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
