
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
  
  console.log("All sessions:", sessions);
  
  const upcomingSessions = sessions.filter(session => {
    try {
      // Fix possible date parsing issues by ensuring valid date format
      const sessionStartTime = parseISO(session.start_time);
      const isUpcoming = isFuture(sessionStartTime);
      const notCancelled = session.status !== 'cancelled';
      
      console.log(`Session ${session.id} - Start: ${session.start_time}, Is future: ${isUpcoming}, Status: ${session.status}`);
      
      return isUpcoming && notCancelled;
    } catch (error) {
      console.error(`Error processing session ${session.id}:`, error);
      return false;
    }
  });
  
  const pastSessions = sessions.filter(session => {
    try {
      return isPast(parseISO(session.end_time)) && session.status !== 'cancelled';
    } catch (error) {
      console.error(`Error processing session ${session.id}:`, error);
      return false;
    }
  });
  
  const cancelledSessions = sessions.filter(session => 
    session.status === 'cancelled'
  );
  
  console.log("Upcoming sessions:", upcomingSessions.length);
  console.log("Past sessions:", pastSessions.length);
  console.log("Cancelled sessions:", cancelledSessions.length);
  
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
    try {
      const start = parseISO(startTime);
      const end = parseISO(endTime);
      const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      return durationMinutes;
    } catch (e) {
      console.error("Error calculating duration:", e);
      return 0;
    }
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
