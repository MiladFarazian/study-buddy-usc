
import { useState } from "react";
import { format, parseISO, isFuture, isPast } from "date-fns";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, User, MapPin, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Session } from "@/types/session";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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
                    onClick={onBookSession}
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
                          onClick={onBookSession}
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
    </>
  );
};
