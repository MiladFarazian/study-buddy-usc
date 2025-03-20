
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, User, Star, MapPin, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AvailabilityCalendar } from "@/components/scheduling/AvailabilityCalendar";
import { format, parseISO, isFuture, isPast } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Session {
  id: string;
  course_id: string | null;
  tutor_id: string;
  student_id: string;
  start_time: string;
  end_time: string;
  location: string | null;
  notes: string | null;
  status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  tutor?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  student?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  course?: {
    id: string;
    course_number: string;
    course_title: string | null;
  };
}

const Schedule = () => {
  const { user, profile, isTutor } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [showDialog, setShowDialog] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
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
  
  const handleBookNewSession = () => {
    navigate('/tutors');
  };
  
  const handleCancelSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setShowDialog(true);
  };
  
  const confirmCancelSession = async () => {
    if (!selectedSessionId) return;
    
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSessionId);
        
      if (error) throw error;
      
      // Update the local state to reflect the cancellation
      setSessions(prev => 
        prev.map(session => 
          session.id === selectedSessionId 
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
    } finally {
      setShowDialog(false);
      setSelectedSessionId(null);
    }
  };
  
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
  
  // Get calendar dates with sessions
  const calendarDates = sessions
    .filter(session => session.status !== 'cancelled')
    .map(session => ({
      date: format(parseISO(session.start_time), 'yyyy-MM-dd'),
      title: session.course?.course_number || 'Tutoring Session'
    }));
  
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
          <Card>
            <CardHeader>
              <CardTitle>Tutor Availability</CardTitle>
              <CardDescription>
                Set your weekly availability to let students book sessions with you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AvailabilityCalendar />
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your Sessions</CardTitle>
            <CardDescription>Your scheduled tutoring appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upcoming">
              <TabsList className="mb-4">
                <TabsTrigger value="upcoming">Upcoming ({upcomingSessions.length})</TabsTrigger>
                <TabsTrigger value="past">Past ({pastSessions.length})</TabsTrigger>
                <TabsTrigger value="canceled">Canceled ({cancelledSessions.length})</TabsTrigger>
              </TabsList>
              
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2">Loading sessions...</span>
                </div>
              ) : (
                <>
                  <TabsContent value="upcoming">
                    {upcomingSessions.length > 0 ? (
                      <div className="space-y-4">
                        {upcomingSessions.map(session => (
                          <div key={session.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex gap-4">
                                <div className="bg-usc-gold/20 text-usc-cardinal-dark rounded-md p-3 h-fit">
                                  <CalendarDays className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium">
                                      {session.course?.course_number 
                                        ? `${session.course.course_number} Tutoring` 
                                        : "Tutoring Session"}
                                    </h3>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                                      {session.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-gray-500 mt-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <CalendarDays className="h-3 w-3" />
                                      <span>{formatSessionDate(session.start_time)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-3 w-3" />
                                      <span>{formatSessionTime(session.start_time)} - {formatSessionTime(session.end_time)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <User className="h-3 w-3" />
                                      <span>
                                        {isTutor 
                                          ? session.student?.first_name && session.student?.last_name 
                                            ? `${session.student.first_name} ${session.student.last_name}`
                                            : "Student"
                                          : session.tutor?.first_name && session.tutor?.last_name
                                            ? `${session.tutor.first_name} ${session.tutor.last_name}`
                                            : "Tutor"
                                        }
                                      </span>
                                    </div>
                                    {session.location && (
                                      <div className="flex items-center gap-2">
                                        <MapPin className="h-3 w-3" />
                                        <span>{session.location}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">Reschedule</Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                                  onClick={() => handleCancelSession(session.id)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No upcoming sessions to display</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={handleBookNewSession}
                        >
                          Book a Session
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="past">
                    {pastSessions.length > 0 ? (
                      <div className="space-y-4">
                        {pastSessions.map(session => (
                          <div key={session.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex gap-4">
                                <div className="bg-gray-100 text-gray-500 rounded-md p-3 h-fit">
                                  <CalendarDays className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium">
                                      {session.course?.course_number 
                                        ? `${session.course.course_number} Tutoring` 
                                        : "Tutoring Session"}
                                    </h3>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                                      Completed
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-gray-500 mt-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <CalendarDays className="h-3 w-3" />
                                      <span>{formatSessionDate(session.start_time)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-3 w-3" />
                                      <span>{formatSessionTime(session.start_time)} - {formatSessionTime(session.end_time)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <User className="h-3 w-3" />
                                      <span>
                                        {isTutor 
                                          ? session.student?.first_name && session.student?.last_name 
                                            ? `${session.student.first_name} ${session.student.last_name}`
                                            : "Student"
                                          : session.tutor?.first_name && session.tutor?.last_name
                                            ? `${session.tutor.first_name} ${session.tutor.last_name}`
                                            : "Tutor"
                                        }
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <Button variant="outline" size="sm">
                                {isTutor ? "View Session" : "Leave Review"}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No past sessions to display</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="canceled">
                    {cancelledSessions.length > 0 ? (
                      <div className="space-y-4">
                        {cancelledSessions.map(session => (
                          <div key={session.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow opacity-75">
                            <div className="flex items-start justify-between">
                              <div className="flex gap-4">
                                <div className="bg-red-50 text-red-400 rounded-md p-3 h-fit">
                                  <CalendarDays className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium">
                                      {session.course?.course_number 
                                        ? `${session.course.course_number} Tutoring` 
                                        : "Tutoring Session"}
                                    </h3>
                                    <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">
                                      Cancelled
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-gray-500 mt-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <CalendarDays className="h-3 w-3" />
                                      <span>{formatSessionDate(session.start_time)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-3 w-3" />
                                      <span>{formatSessionTime(session.start_time)} - {formatSessionTime(session.end_time)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={handleBookNewSession}
                              >
                                Rebook
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No canceled sessions to display</p>
                      </div>
                    )}
                  </TabsContent>
                </>
              )}
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>View your schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
            {calendarDates.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">Upcoming Sessions:</p>
                <div className="space-y-2">
                  {calendarDates
                    .filter((value, index, self) => index === self.findIndex(t => t.date === value.date))
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .slice(0, 5)
                    .map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="h-2 w-2 bg-usc-cardinal rounded-full"></div>
                        <span>{format(new Date(item.date), 'MMM d')} - {item.title}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Recommended Tutors</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Sarah Chen</p>
                      <div className="flex items-center">
                        <Star className="h-3 w-3 fill-usc-gold text-usc-gold" />
                        <span className="text-xs ml-1">4.9</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Mike Johnson</p>
                      <div className="flex items-center">
                        <Star className="h-3 w-3 fill-usc-gold text-usc-gold" />
                        <span className="text-xs ml-1">4.7</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Cancel Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this tutoring session? Cancellations within 24 hours may be subject to a fee.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Keep Session
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmCancelSession}
            >
              Yes, Cancel Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Schedule;
