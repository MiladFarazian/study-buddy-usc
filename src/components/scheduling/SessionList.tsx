
import { useState } from "react";
import { format, parseISO, isFuture, isPast } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Session } from "@/types/session";
import { useAuth } from "@/contexts/AuthContext";
import { SessionListContent } from "@/components/schedule/SessionListContent";
import { CancelSessionDialog } from "@/components/schedule/CancelSessionDialog";

interface SessionListProps {
  sessions: Session[];
  loading: boolean;
  onCancelSession: (sessionId: string) => void;
  onBookSession: () => void;
}

export const SessionList = ({ sessions, loading, onCancelSession, onBookSession }: SessionListProps) => {
  const { isTutor } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  // Filter sessions based on tab
  const upcomingSessions = sessions.filter(session => 
    isFuture(parseISO(session.start_time)) && session.status !== 'cancelled'
  );
  
  const pastSessions = sessions.filter(session => 
    isPast(parseISO(session.end_time)) && session.status !== 'cancelled'
  );
  
  const cancelledSessions = sessions.filter(session => 
    session.status === 'cancelled'
  );
  
  const formatSessionTime = (timeString: string) => {
    try {
      return format(parseISO(timeString), 'h:mm a');
    } catch (e) {
      return timeString;
    }
  };
  
  const formatSessionDate = (timeString: string) => {
    try {
      return format(parseISO(timeString), 'EEE, MMM d, yyyy');
    } catch (e) {
      return timeString;
    }
  };
  
  const calculateDuration = (startTime: string, endTime: string) => {
    const start = parseISO(startTime);
    const end = parseISO(endTime);
    const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    return durationMinutes;
  };
  
  const handleCancelSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setShowDialog(true);
  };
  
  const confirmCancelSession = () => {
    if (!selectedSessionId) return;
    onCancelSession(selectedSessionId);
    setShowDialog(false);
    setSelectedSessionId(null);
  };

  return (
    <>
      <Tabs defaultValue="upcoming">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">Upcoming ({upcomingSessions.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastSessions.length})</TabsTrigger>
          <TabsTrigger value="canceled">Canceled ({cancelledSessions.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming">
          <SessionListContent
            sessions={upcomingSessions}
            loading={loading}
            onCancelSession={handleCancelSession}
            onBookSession={onBookSession}
            formatSessionTime={formatSessionTime}
            formatSessionDate={formatSessionDate}
            calculateDuration={calculateDuration}
            variant="upcoming"
            emptyMessage="No upcoming sessions to display"
          />
        </TabsContent>
        
        <TabsContent value="past">
          <SessionListContent
            sessions={pastSessions}
            loading={loading}
            onCancelSession={handleCancelSession}
            formatSessionTime={formatSessionTime}
            formatSessionDate={formatSessionDate}
            calculateDuration={calculateDuration}
            variant="past"
            emptyMessage="No past sessions to display"
          />
        </TabsContent>
        
        <TabsContent value="canceled">
          <SessionListContent
            sessions={cancelledSessions}
            loading={loading}
            onCancelSession={handleCancelSession}
            onBookSession={onBookSession}
            formatSessionTime={formatSessionTime}
            formatSessionDate={formatSessionDate}
            calculateDuration={calculateDuration}
            variant="cancelled"
            emptyMessage="No canceled sessions to display"
          />
        </TabsContent>
      </Tabs>

      <CancelSessionDialog 
        showDialog={showDialog} 
        setShowDialog={setShowDialog} 
        onConfirmCancel={confirmCancelSession} 
      />
    </>
  );
};
