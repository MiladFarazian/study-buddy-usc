import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Mode = '24h' | '1h' | 'all';

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60000);
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
function formatTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode = 'all' }: { mode?: Mode } = await req.json().catch(() => ({ mode: 'all' }));

    const now = new Date();

    // Build windows
    const windows: Array<{ start: Date; end: Date; label: '24h' | '1h' }> = [];
    if (mode === 'all' || mode === '24h') {
      windows.push({ start: addMinutes(now, 24 * 60), end: addMinutes(now, 24 * 60 + 15), label: '24h' });
    }
    if (mode === 'all' || mode === '1h') {
      windows.push({ start: addMinutes(now, 60), end: addMinutes(now, 60 + 15), label: '1h' });
    }

    let processed = 0;
    const tasks: Promise<any>[] = [];

    for (const w of windows) {
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
          id, start_time, end_time, status, session_type, location, course_id,
          zoom_join_url, zoom_meeting_id, zoom_password,
          reminder_24h_sent_at, reminder_1h_sent_at,
          tutor:profiles!sessions_tutor_id_fkey(id, first_name, last_name),
          student:profiles!sessions_student_id_fkey(id, first_name, last_name)
        `)
        .eq('status', 'scheduled')
        .gte('start_time', w.start.toISOString())
        .lt('start_time', w.end.toISOString());

      if (error) throw error;
      if (!sessions || sessions.length === 0) continue;

      for (const s of sessions as any[]) {
        if (w.label === '24h' && s.reminder_24h_sent_at) continue;
        if (w.label === '1h' && s.reminder_1h_sent_at) continue;

        const start = new Date(s.start_time);
        const end = new Date(s.end_time);

        const sessionDate = formatDate(start);
        const startTime = formatTime(start);
        const endTime = formatTime(end);

        const tutorName = `${s.tutor?.first_name || ''} ${s.tutor?.last_name || ''}`.trim() || 'Tutor';
        const studentName = `${s.student?.first_name || ''} ${s.student?.last_name || ''}`.trim() || 'Student';
        const courseName = s.course_id || 'General tutoring';
        const sessionType = (s.session_type === 'virtual') ? 'virtual' : 'in_person';
        const location = sessionType === 'virtual' ? 'Virtual (Zoom)' : s.location || 'Not specified';

        const subject = `Reminder: Upcoming Tutoring Session`;

        // Student reminder
        tasks.push(
          supabase.functions.invoke('send-notification-email', {
            body: {
              recipientUserId: s.student.id,
              recipientName: studentName,
              subject,
              notificationType: 'session_reminder',
              data: {
                sessionDate,
                tutorName,
                startTime,
                endTime,
                courseName,
                location,
                sessionType,
                zoomJoinUrl: s.zoom_join_url || '',
                zoomMeetingId: s.zoom_meeting_id || '',
                zoomPassword: s.zoom_password || ''
              }
            }
          }).then(async () => {
            if (w.label === '24h') {
              await supabase.from('sessions').update({ reminder_24h_sent_at: new Date().toISOString() }).eq('id', s.id);
            } else {
              await supabase.from('sessions').update({ reminder_1h_sent_at: new Date().toISOString() }).eq('id', s.id);
            }
          }).catch((e) => {
            console.error('[send-session-reminders] Student reminder error:', e);
          })
        );

        // Tutor reminder
        tasks.push(
          supabase.functions.invoke('send-notification-email', {
            body: {
              recipientUserId: s.tutor.id,
              recipientName: tutorName,
              subject,
              notificationType: 'session_reminder',
              data: {
                sessionDate,
                tutorName,
                startTime,
                endTime,
                courseName,
                location,
                sessionType,
                zoomJoinUrl: s.zoom_join_url || '',
                zoomMeetingId: s.zoom_meeting_id || '',
                zoomPassword: s.zoom_password || ''
              }
            }
          }).catch((e) => {
            console.error('[send-session-reminders] Tutor reminder error:', e);
          })
        );

        processed += 2;
      }
    }

    // Fire-and-forget in the background
    // @ts-ignore EdgeRuntime global is available in Deno Deploy environment
    EdgeRuntime?.waitUntil?.(Promise.allSettled(tasks));

    return new Response(JSON.stringify({ success: true, queued: processed }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error: any) {
    console.error('[send-session-reminders] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
