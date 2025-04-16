import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Session } from "@/types/session";
import { SessionList } from "@/components/scheduling/SessionList";
import { ScheduleCalendar } from "@/components/scheduling/ScheduleCalendar"; 
import { TutorAvailabilityCard } from "@/components/scheduling/TutorAvailabilityCard";
import { sendSessionCancellationEmails } from "@/lib/scheduling/email-utils";
import { getUserSessions } from "@/lib/scheduling/session-manager";
import { supabase } from "@/integrations/supabase/client";

const Schedule = () => {
  const { user, profile, isTutor } = useAuth();
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
      // Use our new getUserSessions function to fetch sessions
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
      
      // Update the local state to reflect the cancellation
      setSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, status: 'cancelled' } 
            : session
        )
      );
      
      // Send cancellation emails
      const emailResult = await sendSessionCancellationEmails(sessionId);
      if (!emailResult.success) {
        console.warn("Email notification failed:", emailResult.error);
      }
      
      toast({
        title: "Session Cancelled",
        description: "Your session has been cancelled successfully.",
      });
      
      // Reload sessions to ensure we have the latest data
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
    <div className="py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Schedule</h1>
          <p className="text-muted-foreground">Book and manage your tutoring sessions</p>
        </div>
        <Button 
          className="bg-usc-cardinal hover:bg-usc-cardinal-dark"
          onClick={() => navigate('/tutors')}
        >
          Book New Session
        </Button>
      </div>

      {isTutor && (
        <div className="mb-8">
          <TutorAvailabilityCard tutorId={user?.id} readOnly={false} />
        </div>
      )}

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
    </div>
  );
};

export default Schedule;
