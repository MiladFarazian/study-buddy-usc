
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Session } from "@/types/session";
import { CalendarDays, Clock, User, MapPin, GraduationCap, BookOpen, Calendar, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { SessionCalendarDialog } from "./SessionCalendarDialog";
import { ZoomMeetingActions } from "@/components/zoom/ZoomMeetingActions";
import { useReview } from "@/contexts/ReviewContext";
import { Tutor } from "@/types/tutor";
import { Profile } from "@/integrations/supabase/types-extension";
import { supabase } from "@/integrations/supabase/client";
import { SessionReviewData } from "@/hooks/useSessionReviews";

interface SessionItemProps {
  session: Session;
  onCancelSession: (sessionId: string) => void;
  formatSessionTime: (timeString: string) => string;
  formatSessionDate: (timeString: string) => string;
  calculateDuration: (startTime: string, endTime: string) => number;
  variant: 'upcoming' | 'past' | 'cancelled';
  onBookSession?: () => void;
  reviewData?: SessionReviewData;
}

export const SessionItem = ({ 
  session, 
  onCancelSession, 
  formatSessionTime, 
  formatSessionDate, 
  calculateDuration,
  variant,
  onBookSession,
  reviewData
}: SessionItemProps) => {
  const { user, isTutor } = useAuth();
  const { startTutorReview, startStudentReview } = useReview();
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);
  const [hasExistingReview, setHasExistingReview] = useState(false);

  const isUserTutor = user?.id === session.tutor_id;
  const roleStyleClass = isUserTutor 
    ? "border-l-4 border-usc-cardinal" 
    : "border-l-4 border-usc-gold";

  // Check for existing review when variant is 'past' and user is authenticated
  useEffect(() => {
    const checkExistingReview = async () => {
      if (variant !== 'past' || !user?.id) return;
      
      try {
        const { data } = await supabase
          .from('student_reviews')
          .select('review_id, student_showed_up, teaching_quality, tutor_showed_up')
          .eq('session_id', session.id)
          .maybeSingle();
        
        if (isUserTutor) {
          // Tutor reviewed if record exists AND tutor fields are filled
          setHasExistingReview(data && data.student_showed_up !== null);
        } else {
          // Student reviewed if record exists AND student fields are filled
          setHasExistingReview(data && data.tutor_showed_up !== null && data.teaching_quality !== null);
        }
      } catch (error) {
        console.error('Error checking existing review:', error);
      }
    };

    checkExistingReview();
  }, [variant, session.id, user?.id, isUserTutor]);

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

  const renderStarRating = (rating: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">({rating}/5)</span>
      </div>
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
                  {session.session_type === 'virtual' && (
                    <Badge variant="outline">Virtual</Badge>
                  )}
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

              {/* Review Data Display for Past Sessions */}
              {variant === 'past' && reviewData && (
                <div className="mt-3 p-3 bg-muted/30 rounded-md border">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Session Review</div>
                  <div className="space-y-2">
                    {reviewData.teaching_quality && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Teaching Quality:</span>
                        {renderStarRating(reviewData.teaching_quality)}
                      </div>
                    )}
                    {reviewData.engagement_level && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Engagement Level:</span>
                        {renderStarRating(reviewData.engagement_level)}
                      </div>
                    )}
                    {reviewData.written_feedback && (
                      <div className="text-xs text-muted-foreground">
                        <div className="font-medium mb-1">Feedback:</div>
                        <div className="italic text-foreground/80">"{reviewData.written_feedback}"</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {variant === 'upcoming' && session.session_type === 'virtual' && (
          <div className="pt-2">
            <ZoomMeetingActions session={session} isTutor={isUserTutor} compact />
          </div>
        )}

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
            hasExistingReview ? (
              <span className="text-sm text-gray-500 px-3 py-2">
                Review Completed
              </span>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                type="button"
                onClick={() => {
                  console.log('Review button clicked', { isUserTutor, sessionId: session.id });
                  
                  if (isUserTutor) {
                    const studentProfile: Profile = session.student
                      ? {
                          id: session.student.id,
                          first_name: session.student.first_name || '',
                          last_name: session.student.last_name || '',
                          email: null,
                          avatar_url: session.student.avatar_url || '',
                          role: 'student' as const,
                          approved_tutor: false,
                          stripe_customer_id: null,
                          average_rating: null,
                          bio: null,
                          student_bio: null,
                          tutor_bio: null,
                          student_courses: null,
                          tutor_courses_subjects: null,
                          created_at: new Date().toISOString(),
                          graduation_year: null,
                          hourly_rate: null,
                          major: null,
                          stripe_connect_id: null,
                          stripe_connect_onboarding_complete: false,
                          subjects: null,
                          updated_at: new Date().toISOString(),
                          available_in_person: true,
                          available_online: true,
                          student_onboarding_complete: true,
                          tutor_onboarding_complete: false
                        }
                      : {
                          id: session.student_id,
                          first_name: session.student_first_name || '',
                          last_name: session.student_last_name || '',
                          email: null,
                          avatar_url: '',
                          role: 'student' as const,
                          approved_tutor: false,
                          stripe_customer_id: null,
                          average_rating: null,
                          bio: null,
                          student_bio: null,
                          tutor_bio: null,
                          student_courses: null,
                          tutor_courses_subjects: null,
                          created_at: new Date().toISOString(),
                          graduation_year: null,
                          hourly_rate: null,
                          major: null,
                          stripe_connect_id: null,
                          stripe_connect_onboarding_complete: false,
                          subjects: null,
                          updated_at: new Date().toISOString(),
                          available_in_person: true,
                          available_online: true,
                          student_onboarding_complete: true,
                          tutor_onboarding_complete: false
                        };
                    console.log('Using student profile for review:', studentProfile);
                    startTutorReview(session, studentProfile);
                  } else {
                    const tutorData: Tutor = session.tutor
                      ? {
                          id: session.tutor.id,
                          name: `${session.tutor.first_name || ''} ${session.tutor.last_name || ''}`.trim(),
                          firstName: session.tutor.first_name || '',
                          lastName: session.tutor.last_name || '',
                          field: '',
                          rating: 0,
                          hourlyRate: 0,
                          subjects: [],
                          imageUrl: session.tutor.avatar_url || '',
                          bio: '',
                          graduationYear: ''
                        }
                      : {
                          id: session.tutor_id,
                          name: `${session.tutor_first_name || ''} ${session.tutor_last_name || ''}`.trim(),
                          firstName: session.tutor_first_name || '',
                          lastName: session.tutor_last_name || '',
                          field: '',
                          rating: 0,
                          hourlyRate: 0,
                          subjects: [],
                          imageUrl: '',
                          bio: '',
                          graduationYear: ''
                        };
                    console.log('Using tutor profile for review:', tutorData);
                    startStudentReview(session, tutorData);
                  }
                }}
              >
                {isUserTutor ? "Review Student" : "Review Tutor"}
              </Button>
            )
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
