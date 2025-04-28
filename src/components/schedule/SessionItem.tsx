
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Session } from "@/types/session";
import { CalendarDays, Clock, User, MapPin, GraduationCap, BookOpen, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { SessionCalendarDialog } from "./SessionCalendarDialog";

interface SessionItemProps {
  session: Session;
  onCancelSession: (sessionId: string) => void;
  formatSessionTime: (timeString: string) => string;
  formatSessionDate: (timeString: string) => string;
  calculateDuration: (startTime: string, endTime: string) => number;
  variant: 'upcoming' | 'past' | 'cancelled';
  onBookSession?: () => void;
}

export const SessionItem = ({ 
  session, 
  onCancelSession, 
  formatSessionTime, 
  formatSessionDate, 
  calculateDuration,
  variant,
  onBookSession
}: SessionItemProps) => {
  const { user, isTutor } = useAuth();
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);
  
  const isUserTutor = user?.id === session.tutor_id;
  const roleStyleClass = isUserTutor 
    ? "border-l-4 border-usc-cardinal" 
    : "border-l-4 border-usc-gold";

  const getBadge = () => {
    switch (variant) {
      case 'upcoming':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
            {session.status === 'confirmed' ? 'Confirmed' : 'Pending'}
          </Badge>
        );
      case 'past':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
            Completed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">
            Cancelled
          </Badge>
        );
    }
  };

  const getRoleBadge = () => {
    if (isUserTutor) {
      return (
        <Badge variant="outline" className="bg-usc-cardinal/10 text-usc-cardinal border-usc-cardinal/30">
          You're tutoring
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-usc-gold/10 text-usc-gold-dark border-usc-gold/30">
        You're learning
        </Badge>
    );
  };

  const getIconContainerClass = () => {
    switch (variant) {
      case 'upcoming':
        return isUserTutor 
          ? "bg-usc-cardinal/20 text-usc-cardinal-dark" 
          : "bg-usc-gold/20 text-usc-gold-dark";
      case 'past':
        return "bg-gray-100 text-gray-500";
      case 'cancelled':
        return "bg-red-50 text-red-400";
    }
  };

  const getSessionIcon = () => {
    return isUserTutor ? (
      <GraduationCap className="h-5 w-5" />
    ) : (
      <BookOpen className="h-5 w-5" />
    );
  };

  return (
    <div className={`border rounded-lg p-4 hover:shadow-sm transition-shadow ${roleStyleClass}`}>
      <div className="flex flex-col space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex gap-4 flex-1">
            <div className={`${getIconContainerClass()} rounded-md p-3 h-fit`}>
              {getSessionIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h3 className="font-medium">
                  {session.course?.course_number 
                    ? `${session.course.course_number} Tutoring` 
                    : "Tutoring Session"}
                </h3>
                <div className="flex flex-wrap gap-2 items-center">
                  {getBadge()}
                  {getRoleBadge()}
                </div>
              </div>
              <div className="text-sm text-gray-500 space-y-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-3 w-3 shrink-0" />
                  <span className="truncate">{formatSessionDate(session.start_time)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {formatSessionTime(session.start_time)} - {formatSessionTime(session.end_time)}
                    <span className="ml-1 text-xs text-gray-400">
                      ({calculateDuration(session.start_time, session.end_time)} mins)
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 shrink-0" />
                  <span className="font-medium truncate">
                    {isUserTutor 
                      ? session.student?.first_name && session.student?.last_name 
                        ? `Student: ${session.student.first_name} ${session.student.last_name}`
                        : "Student"
                      : session.tutor?.first_name && session.tutor?.last_name
                        ? `Tutor: ${session.tutor.first_name} ${session.tutor.last_name}`
                        : "Tutor"
                    }
                  </span>
                </div>
                {session.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{session.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
          {variant === 'upcoming' && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowCalendarDialog(true)}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Add to Calendar
              </Button>
              <Button variant="outline" size="sm">Reschedule</Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                onClick={() => onCancelSession(session.id)}
              >
                Cancel
              </Button>
            </>
          )}
          {variant === 'past' && (
            <Button variant="outline" size="sm">
              {isUserTutor ? "View Session" : "Leave Review"}
            </Button>
          )}
          {variant === 'cancelled' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onBookSession}
            >
              Rebook
            </Button>
          )}
        </div>
      </div>

      <SessionCalendarDialog
        session={session}
        open={showCalendarDialog}
        onClose={() => setShowCalendarDialog(false)}
      />
    </div>
  );
};
