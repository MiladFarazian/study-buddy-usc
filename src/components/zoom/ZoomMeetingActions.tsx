import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Link as LinkIcon, PlayCircle, Video, Smartphone, RefreshCw } from "lucide-react";
import { Session } from "@/types/session";
import { useJoinWindow, useCountdown } from "@/hooks/useCountdown";
import { getMeetingDetails } from "@/lib/zoomAPI";

interface ZoomMeetingActionsProps {
  session: Session;
  isTutor?: boolean;
  compact?: boolean; // smaller layout for cards
}

export const ZoomMeetingActions: React.FC<ZoomMeetingActionsProps> = ({ session, isTutor = false, compact = false }) => {
  const isVirtual = (session.session_type || "in_person") === "virtual";
  const joinUrl = session.zoom_join_url || undefined;
  const startUrl = (session as any).zoom_start_url || undefined;
  const meetingId = session.zoom_meeting_id || undefined;
  const password = (session as any).zoom_password || undefined;

  const { canJoinNow } = useJoinWindow(session.start_time, session.end_time, 10);
  const countdown = useCountdown(session.start_time);

  const [status, setStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const within30 = Math.abs(new Date(session.start_time).getTime() - Date.now()) < 30 * 60 * 1000;
    if (isVirtual && meetingId && within30) {
      // Preload status close to start
      void handleCheckStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVirtual, meetingId, session.start_time]);

  const handleCheckStatus = async () => {
    if (!meetingId) return;
    try {
      setChecking(true);
      const resp = await getMeetingDetails(meetingId);
      if (resp?.error) throw new Error(resp.error);
      setStatus(resp.status || null);
    } catch (e) {
      setStatus(null);
    } finally {
      setChecking(false);
    }
  };

  const copy = async (text?: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  const deepLink = useMemo(() => {
    if (!meetingId) return undefined;
    const pwd = password ? `&pwd=${encodeURIComponent(password)}` : "";
    return `zoommtg://zoom.us/join?action=join&confno=${encodeURIComponent(meetingId)}${pwd}`;
  }, [meetingId, password]);

  if (!isVirtual) return null;

  return (
    <section className={`rounded-md border p-3 ${compact ? "bg-muted/40" : "bg-muted/20"}`} aria-label="Zoom meeting actions">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4" />
          <span className="text-sm font-medium">Virtual session</span>
          <Badge variant="outline">Zoom</Badge>
          {status && (
            <Badge variant="outline" className="capitalize">{status.replace(/_/g, " ")}</Badge>
          )}
        </div>
        {meetingId && (
          <Button variant="ghost" size="icon" onClick={handleCheckStatus} aria-label="Refresh meeting status">
            {checking ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Countdown */}
      <div className="text-xs text-muted-foreground mb-3">
        Starts in {Math.max(countdown.days, 0)}d {Math.max(countdown.hours, 0)}h {Math.max(countdown.minutes, 0)}m {Math.max(countdown.seconds, 0)}s
      </div>

      {/* Primary actions */}
      <div className={`flex ${compact ? "flex-col sm:flex-row" : "flex-col sm:flex-row"} gap-2`}>
        {isTutor ? (
          <Button asChild disabled={!canJoinNow || !startUrl} className="sm:flex-1">
            <a href={startUrl || "#"} target="_blank" rel="noopener noreferrer">
              <PlayCircle className="h-4 w-4 mr-2" />
              {canJoinNow ? "Start Meeting" : "Start (available soon)"}
            </a>
          </Button>
        ) : (
          <Button asChild disabled={!canJoinNow || !joinUrl} className="sm:flex-1">
            <a href={(deepLink || joinUrl || "#")} target="_blank" rel="noopener noreferrer">
              <Video className="h-4 w-4 mr-2" />
              {canJoinNow ? "Join Meeting" : "Join (available soon)"}
            </a>
          </Button>
        )}
        <Button variant="outline" asChild className="sm:flex-1">
          <a href="https://zoom.us/test" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" /> Test Zoom
          </a>
        </Button>
      </div>

      {/* Details */}
      <div className="mt-3 space-y-2 text-sm">
        {joinUrl && (
          <div className="flex items-center gap-2 break-all">
            <LinkIcon className="h-4 w-4 shrink-0" />
            <a href={joinUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
              {joinUrl}
            </a>
            <Button variant="ghost" size="icon" aria-label="Copy join link" onClick={() => copy(joinUrl)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )}
        {(meetingId || password) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {meetingId && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Meeting ID:</span>
                <span className="font-mono">{meetingId}</span>
                <Button variant="ghost" size="icon" aria-label="Copy meeting ID" onClick={() => copy(meetingId)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}
            {password && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Password:</span>
                <span className="font-mono">{password}</span>
                <Button variant="ghost" size="icon" aria-label="Copy password" onClick={() => copy(password)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
        {/* Mobile app & deep link */}
        <div className="flex flex-wrap gap-2 mt-2">
          {deepLink && (
            <Button asChild variant="outline" size="sm">
              <a href={deepLink}>
                <Smartphone className="h-4 w-4 mr-2" /> Open in Zoom app
              </a>
            </Button>
          )}
          <Button asChild variant="ghost" size="sm">
            <a href="https://apps.apple.com/us/app/zoom-one-platform-to-connect/id546505307" target="_blank" rel="noopener noreferrer">iOS app</a>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href="https://play.google.com/store/apps/details?id=us.zoom.videomeetings" target="_blank" rel="noopener noreferrer">Android app</a>
          </Button>
        </div>
        {/* Troubleshooting */}
        <div className="text-xs text-muted-foreground mt-2">
          Having issues? Try the Test link above, switch networks, or join via browser. See Zoom help: {" "}
          <a href="https://support.zoom.com/hc/en" target="_blank" rel="noopener noreferrer" className="underline">support.zoom.com</a>
        </div>
      </div>
    </section>
  );
};
