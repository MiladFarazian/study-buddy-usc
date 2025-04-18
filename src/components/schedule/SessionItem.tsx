
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Session } from "@/types/session";
import { formatDistanceToNow, isFuture } from "date-fns";
import { CalendarDays, Clock, User, MapPin, GraduationCap, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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
  
  // Determine if the current user is the tutor in this session
  const isUserTutor = user?.id === session.tutor_id;
  
  // Set the appropriate style class based on whether the user is the tutor or student
  const roleStyleClass = isUserTutor 
    ? "border-l-4 border-usc-cardinal" 
    : "border-l-4 border-usc-gold";

  // Determine the badge appearance based on session status and variant
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

  // Get role badge to show if user is tutor or student in this session
  const getRoleBadge = () => {
    if (isUserTutor) {
      return (
        <Badge variant="outline" className="bg-usc-cardinal/10 text-usc-cardinal border-usc-cardinal/30 ml-2">
          You're tutoring
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-usc-gold/10 text-usc-gold-dark border-usc-gold/30 ml-2">
          You're learning
        </Badge>
      );
    }
  };

  // Determine the icon container style based on variant
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

  // Choose the appropriate icon based on user role
  const getSessionIcon = () => {
    return isUserTutor ? (
      <GraduationCap className="h-5 w-5" />
    ) : (
      <BookOpen className="h-5 w-5" />
    );
  };

  return (
    <div className={`border rounded-lg p-4 hover:shadow-sm transition-shadow ${roleStyleClass}`}>
      <div className="flex items-start justify-between">
        <div className="flex gap-4">
          <div className={`${getIconContainerClass()} rounded-md p-3 h-fit`}>
            {getSessionIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">
                {session.course?.course_number 
                  ? `${session.course.course_number} Tutoring` 
                  : "Tutoring Session"}
              </h3>
              {getBadge()}
              {getRoleBadge()}
            </div>
            <div className="text-sm text-gray-500 mt-1 space-y-1">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-3 w-3" />
                <span>{formatSessionDate(session.start_time)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>
                  {formatSessionTime(session.start_time)} - {formatSessionTime(session.end_time)}
                  <span className="ml-1 text-xs text-gray-400">
                    ({calculateDuration(session.start_time, session.end_time)} mins)
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-3 w-3" />
                <span className="font-medium">
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
                  <MapPin className="h-3 w-3" />
                  <span>{session.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        {variant === 'upcoming' && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Reschedule</Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
              onClick={() => onCancelSession(session.id)}
            >
              Cancel
            </Button>
          </div>
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
  );
};
