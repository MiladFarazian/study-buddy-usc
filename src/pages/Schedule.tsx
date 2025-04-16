
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Session } from "@/types/session";
import { SessionList } from "@/components/scheduling/SessionList";
import { ScheduleCalendar } from "@/components/scheduling/ScheduleCalendar"; 
import { TutorAvailabilityCard } from "@/components/scheduling/TutorAvailabilityCard";
import { sendSessionCancellationEmails } from "@/lib/scheduling/email-utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { fetchCourseDetails } from "@/lib/scheduling/course-utils";

const Schedule = () => {
  const { user, profile, isTutor } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
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
      // Step 1: Fetch basic session data first
      const { data: basicSessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq(isTutor ? 'tutor_id' : 'student_id', user.id)
        .order('start_time', { ascending: true });
        
      if (sessionError) throw sessionError;
      if (!basicSessionData) {
        setSessions([]);
        setLoading(false);
        return;
      }
      
      // Step 2: Process sessions one by one to avoid deep type instantiation
      const formattedSessions: Session[] = [];
      
      for (const session of basicSessionData) {
        // Step 3: Get tutor details - using .maybeSingle() to avoid errors
        const { data: tutorData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .eq('id', session.tutor_id)
          .maybeSingle();
          
        // Step 4: Get student details - using .maybeSingle() to avoid errors
        const { data: studentData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .eq('id', session.student_id)
          .maybeSingle();
        
        // Step 5: Get course details if available
        let courseDetails = null;
        if (session.course_id) {
          try {
            // Get course details using the utility function
            courseDetails = await fetchCourseDetails(session.course_id);
          } catch (courseError) {
            console.warn("Error processing course details:", courseError);
          }
        }
        
        // Step 6: Construct the complete session object
        formattedSessions.push({
          ...session,
          tutor: tutorData || undefined,
          student: studentData || undefined,
          course: courseDetails
        });
      }
      
      setSessions(formattedSessions);
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
    <div className={`${isMobile ? 'py-3 px-1' : 'py-6'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 md:mb-8">
        <div>
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold mb-1 md:mb-2`}>Schedule</h1>
          <p className={`${isMobile ? 'text-sm' : 'text-base'} text-muted-foreground`}>Book and manage your tutoring sessions</p>
        </div>
        <Button 
          className="bg-usc-cardinal hover:bg-usc-cardinal-dark w-full md:w-auto"
          onClick={() => navigate('/tutors')}
        >
          Book New Session
        </Button>
      </div>

      {isTutor && (
        <div className="mb-4 md:mb-8">
          <TutorAvailabilityCard tutorId={user?.id} readOnly={false} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        <Card className="lg:col-span-2 h-full">
          <CardHeader className={isMobile ? "p-3" : ""}>
            <CardTitle className={isMobile ? "text-lg" : ""}>Your Sessions</CardTitle>
            <CardDescription>Your scheduled tutoring appointments</CardDescription>
          </CardHeader>
          <CardContent className={isMobile ? "p-3 pt-0" : "pt-0"}>
            <SessionList 
              sessions={sessions}
              loading={loading}
              onCancelSession={handleCancelSession}
              onBookSession={handleBookNewSession}
            />
          </CardContent>
        </Card>

        <div className="h-full">
          <ScheduleCalendar sessions={sessions} />
        </div>
      </div>
    </div>
  );
};

export default Schedule;
