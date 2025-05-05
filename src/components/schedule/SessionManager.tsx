
import { useState, useEffect, useCallback } from "react";
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
import { LoadingDisplay } from "@/components/scheduling/calendar/LoadingDisplay";

export const SessionManager = () => {
  const { user, isTutor } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  
  const loadSessions = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log("Loading sessions for user:", user.id);
      // Pass isTutor just for logging purposes, but we'll get all sessions regardless
      const userSessions = await getUserSessions(user.id, !!isTutor);
      console.log("Loaded sessions:", userSessions);
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
  }, [user, isTutor, toast]);
  
  // Load sessions initially
  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user, loadSessions]);
  
  // Set up subscription for real-time updates to sessions
  useEffect(() => {
    if (!user) return;
    
    // Subscribe to session changes
    const channel = supabase
      .channel('sessions-changes')
      .on('postgres_changes', {
        event: '*', // Listen for all events (insert, update, delete)
        schema: 'public',
        table: 'sessions',
        filter: `student_id=eq.${user.id}` + (isTutor ? `,tutor_id=eq.${user.id}` : '')
      }, (payload) => {
        console.log('Session changes detected:', payload);
        // Reload sessions when changes are detected
        loadSessions();
      })
      .subscribe();
    
    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isTutor, loadSessions]);
  
  const handleBookNewSession = () => {
    navigate('/tutors');
  };
  
  const handleCancelSession = async (sessionId: string) => {
    try {
      console.log("Cancelling session:", sessionId);
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
      
      // Reload sessions to ensure UI is in sync with the database
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

  if (loading && sessions.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your Sessions</CardTitle>
            <CardDescription>Your scheduled tutoring appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <LoadingDisplay message="Loading your sessions..." />
          </CardContent>
        </Card>

        <ScheduleCalendar sessions={[]} />
      </div>
    );
  }

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
