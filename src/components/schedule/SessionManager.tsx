
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Session } from "@/types/session";
import { SessionList } from "@/components/scheduling/SessionList";
import { ScheduleCalendar } from "@/components/scheduling/ScheduleCalendar"; 
import { sendSessionCancellationEmails } from "@/lib/scheduling/email-utils";
import { getUserSessions } from "@/lib/scheduling/session-manager";
import { supabase } from "@/integrations/supabase/client";

export const SessionManager = () => {
  const { user, isTutor } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);
  
  const loadSessions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userSessions = await getUserSessions(user.id, !!isTutor);
      setSessions(userSessions);
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast({
        title: "Error",
        description: "Failed to load your sessions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleBookNewSession = () => {
    navigate('/tutors');
  };
  
  const handleCancelSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);
        
      if (error) throw error;
      
      setSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, status: 'cancelled' } 
            : session
        )
      );
      
      const emailResult = await sendSessionCancellationEmails(sessionId);
      if (!emailResult.success) {
        console.warn("Email notification failed:", emailResult.error);
      }
      
      toast({
        title: "Session Cancelled",
        description: "Your session has been cancelled successfully.",
      });
      
      loadSessions();
    } catch (error) {
      console.error("Error cancelling session:", error);
      toast({
        title: "Error",
        description: "Failed to cancel the session. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Your Sessions</CardTitle>
          <CardDescription>Your scheduled tutoring appointments</CardDescription>
        </CardHeader>
        <CardContent>
          <SessionList 
            sessions={sessions}
            loading={loading}
            onCancelSession={handleCancelSession}
            onBookSession={handleBookNewSession}
          />
        </CardContent>
      </Card>

      <ScheduleCalendar sessions={sessions} />
    </div>
  );
};
