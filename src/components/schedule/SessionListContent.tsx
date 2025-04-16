
import { Loader2 } from "lucide-react";
import { Session } from "@/types/session";
import { SessionItem } from "./SessionItem";
import { EmptySessionState } from "./EmptySessionState";

interface SessionListContentProps {
  sessions: Session[];
  loading: boolean;
  onCancelSession: (sessionId: string) => void;
  onBookSession?: () => void;
  formatSessionTime: (timeString: string) => string;
  formatSessionDate: (timeString: string) => string;
  calculateDuration: (startTime: string, endTime: string) => number;
  variant: 'upcoming' | 'past' | 'cancelled';
  emptyMessage: string;
}

export const SessionListContent = ({
  sessions,
  loading,
  onCancelSession,
  onBookSession,
  formatSessionTime,
  formatSessionDate,
  calculateDuration,
  variant,
  emptyMessage
}: SessionListContentProps) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2">Loading sessions...</span>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <EmptySessionState 
        message={emptyMessage} 
        onAction={onBookSession} 
        showButton={variant === 'upcoming' && !!onBookSession}
      />
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map(session => (
        <SessionItem
          key={session.id}
          session={session}
          onCancelSession={onCancelSession}
          formatSessionTime={formatSessionTime}
          formatSessionDate={formatSessionDate}
          calculateDuration={calculateDuration}
          variant={variant}
          onBookSession={onBookSession}
        />
      ))}
    </div>
  );
};
