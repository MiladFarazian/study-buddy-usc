import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Best-effort in-memory cache (not guaranteed across cold starts)
let cachedToken: { access_token: string; expires_at: number } | null = null;
// Simple per-IP rate limiter (best-effort per instance)
const ipBuckets = new Map<string, { last: number; count: number }>();
const WINDOW_MS = 10_000; // 10s window
const MAX_REQ = 5; // max 5 requests per IP per 10s

async function getAccessToken(): Promise<{ access_token: string; expires_in: number }> {
  const accountId = Deno.env.get("ZOOM_ACCOUNT_ID");
  const clientId = Deno.env.get("ZOOM_API_KEY");
  const clientSecret = Deno.env.get("ZOOM_API_SECRET");

  if (!accountId || !clientId || !clientSecret) {
    throw new Error("Missing Zoom credentials (ZOOM_ACCOUNT_ID, ZOOM_API_KEY, ZOOM_API_SECRET)");
  }

  const now = Date.now();
  if (cachedToken && cachedToken.expires_at - 30_000 > now) {
    // Return cached token with 30s safety margin
    return { access_token: cachedToken.access_token, expires_in: Math.max(0, Math.floor((cachedToken.expires_at - now) / 1000)) };
  }

  const auth = btoa(`${clientId}:${clientSecret}`);
  const url = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Zoom token error:", res.status, text);
      throw new Error(`Failed to obtain Zoom access token (${res.status})`);
    }

    const data = await res.json();
    const expiresIn = data.expires_in ?? 3500; // seconds
    cachedToken = {
      access_token: data.access_token,
      expires_at: Date.now() + expiresIn * 1000,
    };

    return { access_token: data.access_token, expires_in: expiresIn };
  } finally {
    clearTimeout(timeout);
  }
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Simple rate-limit by IP
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const now = Date.now();
    const bucket = ipBuckets.get(ip) || { last: now, count: 0 };
    if (now - bucket.last > WINDOW_MS) {
      bucket.last = now; bucket.count = 0;
    }
    bucket.count += 1;
    ipBuckets.set(ip, bucket);
    if (bucket.count > MAX_REQ) {
      return new Response(JSON.stringify({ error: "rate_limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const token = await getAccessToken();
    return new Response(JSON.stringify({ ...token }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("zoom-access-token error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
