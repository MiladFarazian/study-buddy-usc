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

function mapMeeting(meeting: any) {
  return {
    id: meeting.id?.toString?.() ?? meeting.id,
    join_url: meeting.join_url ?? null,
    start_url: meeting.start_url ?? null,
    password: meeting.password ?? null,
    status: meeting.status ?? meeting.settings?.approval_type ?? null,
    error: null as string | null,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const meetingId = body.meeting_id || body.meetingId;
    const updates = body.updates || {};
    if (!meetingId) {
      return new Response(JSON.stringify({ error: "meeting_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const token = await getAccessToken();

    // Prepare payload enforcing some reasonable defaults if not provided
    const payload: any = {};
    if (updates.topic) payload.topic = updates.topic;
    if (updates.start_time) payload.start_time = updates.start_time; // ISO8601
    if (updates.duration) payload.duration = updates.duration; // minutes
    if (updates.timezone) payload.timezone = updates.timezone;
    if (updates.password) payload.password = updates.password;

    if (updates.settings || true) {
      payload.settings = {
        waiting_room: updates.settings?.waiting_room ?? true,
        join_before_host: updates.settings?.join_before_host ?? false,
        mute_upon_entry: updates.settings?.mute_upon_entry ?? true,
        participant_video: updates.settings?.participant_video ?? false,
        host_video: updates.settings?.host_video ?? false,
        approval_type: updates.settings?.approval_type ?? 2, // no registration required
        auto_recording: updates.settings?.auto_recording ?? "cloud",
        ...updates.settings,
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    const patchUrl = `https://api.zoom.us/v2/meetings/${encodeURIComponent(meetingId)}`;
    try {
      const patchRes = await fetch(patchUrl, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!patchRes.ok && patchRes.status !== 204) {
        const t = await patchRes.text();
        console.error("update-zoom-meeting patch failed:", patchRes.status, t);
        return new Response(JSON.stringify({ id: meetingId, join_url: null, start_url: null, password: null, status: null, error: `Zoom error ${patchRes.status}` }), { status: patchRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Fetch updated details
      const getRes = await fetch(patchUrl, { headers: { Authorization: `Bearer ${token}` } });
      const text = await getRes.text();
      if (!getRes.ok) {
        console.error("update-zoom-meeting get failed:", getRes.status, text);
        return new Response(JSON.stringify({ id: meetingId, join_url: null, start_url: null, password: null, status: null, error: `Zoom error ${getRes.status}` }), { status: getRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const meeting = JSON.parse(text);
      return new Response(JSON.stringify(mapMeeting(meeting)), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } finally {
      clearTimeout(timeout);
    }
  } catch (e) {
    console.error("update-zoom-meeting error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ id: null, join_url: null, start_url: null, password: null, status: null, error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
