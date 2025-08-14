
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
import { cancelSessionBooking } from "@/lib/scheduling/booking-utils";

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
  
  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user, loadSessions]);
  
  // Subscribe to session changes using Supabase realtime
  useEffect(() => {
    if (!user) return;
    
    // Subscribe to changes in the sessions table for this user
    const subscription = supabase
      .channel('sessions-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'sessions',
          filter: `student_id=eq.${user.id},tutor_id=eq.${user.id}` 
        },
        (payload) => {
          console.log('Session change detected:', payload);
          // Update sessions state directly instead of full reload
          if (payload.eventType === 'INSERT' && payload.new) {
            setSessions(prev => [...prev, payload.new as Session]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setSessions(prev => prev.map(session => 
              session.id === payload.new.id ? payload.new as Session : session
            ));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setSessions(prev => prev.filter(session => session.id !== payload.old.id));
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);
  
  const handleBookNewSession = () => {
    navigate('/tutors');
  };
  
  const handleCancelSession = async (sessionId: string) => {
    try {
      console.log("Cancelling session:", sessionId);
      const ok = await cancelSessionBooking(sessionId);
      if (!ok) throw new Error('Cancellation failed');

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

      // Session state already updated above, no need to reload
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
