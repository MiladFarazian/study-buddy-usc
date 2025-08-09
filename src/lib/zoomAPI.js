// Zoom API frontend wrapper using Supabase Edge Functions
// Provides: getZoomAccessToken, createZoomMeeting, updateZoomMeeting, deleteZoomMeeting, getMeetingDetails
// All methods return a standardized shape: { id, join_url, start_url, password, status, error }

import { supabase } from "@/integrations/supabase/client";

const TIMEOUT_MS = 30_000;

let cachedToken = null;
let tokenExpiresAt = 0; // epoch ms

function withTimeout(promise) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)),
  ]);
}

function standardize(resp, fallback = {}) {
  const data = resp?.data ?? resp;
  const error = resp?.error ?? null;
  return {
    id: data?.id ?? fallback.id ?? null,
    join_url: data?.join_url ?? null,
    start_url: data?.start_url ?? null,
    password: data?.password ?? null,
    status: data?.status ?? null,
    error: error ?? data?.error ?? null,
  };
}

export async function getZoomAccessToken() {
  // Return cached if valid with 30s buffer
  const now = Date.now();
  if (cachedToken && tokenExpiresAt - 30_000 > now) {
    return { access_token: cachedToken, error: null };
  }
  try {
    const resp = await withTimeout(supabase.functions.invoke("zoom-access-token", { body: {} }));
    if (resp.error || !resp.data?.access_token) {
      return { access_token: null, error: resp.error || "Failed to get token" };
    }
    cachedToken = resp.data.access_token;
    const expiresIn = Math.max(60, Number(resp.data.expires_in || 3600));
    tokenExpiresAt = Date.now() + expiresIn * 1000;
    return { access_token: cachedToken, error: null };
  } catch (e) {
    console.error("getZoomAccessToken error", e);
    return { access_token: null, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function createZoomMeeting(sessionData) {
  // Expecting: { tutor_id, student_name, course_name, start_time, end_time }
  // Server applies defaults: waiting room, password required, timezone/recording controls
  try {
    const resp = await withTimeout(
      supabase.functions.invoke("create-zoom-meeting", {
        body: {
          tutor_id: sessionData?.tutor_id,
          student_name: sessionData?.student_name,
          course_name: sessionData?.course_name,
          start_time: sessionData?.start_time,
          end_time: sessionData?.end_time,
          // Optional config passthrough (edge function may ignore unknown fields)
          config: {
            duration: sessionData?.duration, // in minutes
            timezone: sessionData?.timezone,
            auto_recording: sessionData?.auto_recording ?? "cloud",
            waiting_room: true,
            password_required: true,
          },
        },
      })
    );
    return standardize(resp, {});
  } catch (e) {
    console.error("createZoomMeeting error", e);
    return { id: null, join_url: null, start_url: null, password: null, status: null, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateZoomMeeting(meetingId, updates = {}) {
  try {
    const resp = await withTimeout(
      supabase.functions.invoke("update-zoom-meeting", {
        body: {
          meeting_id: meetingId,
          updates,
        },
      })
    );
    return standardize(resp, { id: meetingId });
  } catch (e) {
    console.error("updateZoomMeeting error", e);
    return { id: meetingId ?? null, join_url: null, start_url: null, password: null, status: null, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteZoomMeeting(meetingId) {
  try {
    const resp = await withTimeout(
      supabase.functions.invoke("delete-zoom-meeting", {
        body: { meeting_id: meetingId },
      })
    );
    const data = standardize(resp, { id: meetingId });
    if (!data.error) data.status = data.status || "deleted";
    return data;
  } catch (e) {
    console.error("deleteZoomMeeting error", e);
    return { id: meetingId ?? null, join_url: null, start_url: null, password: null, status: null, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function getMeetingDetails(meetingId) {
  try {
    const resp = await withTimeout(
      supabase.functions.invoke("get-zoom-meeting", {
        body: { meeting_id: meetingId },
      })
    );
    return standardize(resp, { id: meetingId });
  } catch (e) {
    console.error("getMeetingDetails error", e);
    return { id: meetingId ?? null, join_url: null, start_url: null, password: null, status: null, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

// Helpers for meeting duration & timezone mapping
export function getDurationFromSession(startTimeISO, endTimeISO) {
  try {
    const start = new Date(startTimeISO);
    const end = new Date(endTimeISO);
    const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
    // Snap to common blocks (30/60/90)
    if (minutes <= 45) return 30;
    if (minutes <= 75) return 60;
    return 90;
  } catch {
    return 60;
  }
}

export function getUserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Los_Angeles";
  } catch {
    return "America/Los_Angeles";
  }
}
