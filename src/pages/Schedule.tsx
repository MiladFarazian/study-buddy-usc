
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Session } from "@/types/session";
import { SessionList } from "@/components/scheduling/SessionList";
import { ScheduleCalendar } from "@/lib/scheduling";
import { TutorAvailabilityCard } from "@/components/scheduling/TutorAvailabilityCard";

const Schedule = () => {
  const { user, profile, isTutor } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load sessions when the user is logged in
  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);
  
  const loadSessions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // If user is a tutor, fetch sessions where they are the tutor
      // If user is a student, fetch sessions where they are the student
      const userField = isTutor ? 'tutor_id' : 'student_id';
      
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          tutor:profiles!tutor_id(id, first_name, last_name, avatar_url),
          student:profiles!student_id(id, first_name, last_name, avatar_url)
        `)
        .eq(userField, user.id)
        .order('start_time', { ascending: true });
        
      if (error) throw error;
      
      setSessions(data || []);
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
      
      toast({
        title: "Session Cancelled",
        description: "Your session has been cancelled successfully.",
      });
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
          onClick={handleBookNewSession}
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
