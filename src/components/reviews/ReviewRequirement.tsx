import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthState } from "@/hooks/useAuthState";
import { StudentReviewModal } from "./StudentReviewModal";
import { TutorReviewModal } from "./TutorReviewModal";
import { Session } from "@/types/session";
import { Profile } from "@/integrations/supabase/types-extension";
import { Tutor } from "@/types/tutor";
import { useToast } from "@/hooks/use-toast";

interface PendingReview {
  session: Session;
  otherParticipant: Profile;
}

export function ReviewRequirement() {
  const { user, profile } = useAuthState();
  const { toast } = useToast();
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [currentReview, setCurrentReview] = useState<PendingReview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for pending reviews on mount and when user changes
  useEffect(() => {
    if (user && profile) {
      checkForPendingReviews();
    }
  }, [user, profile]);

  // Set up real-time subscription for session status changes with delay
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('session-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `or=(student_id.eq.${user.id},tutor_id.eq.${user.id})`
        },
        (payload) => {
          // When a session status changes, check for new pending reviews after delay
          if (payload.new.status === 'completed') {
            // Wait 2 hours before checking for reviews to avoid immediate popups
            setTimeout(() => {
              checkForPendingReviews();
            }, 2 * 60 * 60 * 1000); // 2 hours delay
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Helper function to validate if review should be shown
  const shouldShowReview = async (session: any) => {
    // 1. Session must be completed (not a new booking!)
    if (session.status !== 'completed') return false;
    
    // 2. User must be the student (tutors handle differently)
    if (profile?.role === 'student' && session.student_id !== user.id) return false;
    if (profile?.role === 'tutor' && session.tutor_id !== user.id) return false;
    
    // 3. Session must be at least 1 hour old (not immediate after completion)
    const sessionEndTime = new Date(session.end_time).getTime();
    const sessionAge = Date.now() - sessionEndTime;
    const oneHour = 60 * 60 * 1000;
    if (sessionAge < oneHour) return false;
    
    // 4. CHECK IF REVIEW ALREADY EXISTS (critical!)
    if (profile?.role === 'student') {
      // For students: check if they already reviewed this session
      const { data: existingStudentReview } = await supabase
        .from('student_reviews')
        .select('review_id')
        .eq('session_id', session.id)
        .eq('student_id', user.id)
        .maybeSingle();
        
      if (existingStudentReview) {
        return false; // Student already reviewed - don't show popup
      }
    } else if (profile?.role === 'tutor') {
      // For tutors: check if they already completed their review portion
      const { data: existingTutorReview } = await supabase
        .from('student_reviews')
        .select('review_id, student_showed_up, came_prepared')
        .eq('session_id', session.id)
        .eq('tutor_id', user.id)
        .maybeSingle();
        
      // If tutor review exists and has tutor-specific fields filled
      if (existingTutorReview && existingTutorReview.student_showed_up !== null) {
        return false; // Tutor already reviewed
      }
    }
    
    return true; // OK to show review modal
  };

  const checkForPendingReviews = async () => {
    if (!user || !profile) return;

    setIsLoading(true);
    
    try {
      // Get all completed sessions where user is participant
      const { data: completedSessions, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          *,
          tutor:profiles!sessions_tutor_id_fkey(*),
          student:profiles!sessions_student_id_fkey(*)
        `)
        .eq('status', 'completed')
        .or(`student_id.eq.${user.id},tutor_id.eq.${user.id}`)
        .order('start_time', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Filter sessions using comprehensive validation
      const validSessions = [];
      for (const session of completedSessions || []) {
        if (await shouldShowReview(session)) {
          validSessions.push(session);
        }
      }

      const sessionsNeedingReview = validSessions;

      // Create pending review objects
      const pending: PendingReview[] = sessionsNeedingReview
        .filter(session => session.tutor && session.student) // Ensure both participants exist
        .map(session => {
          const isUserStudent = session.student_id === user.id;
          const otherParticipant = isUserStudent ? session.tutor! : session.student!;
          
          // Convert to Session type expected by components
          const sessionData: Session = {
            id: session.id,
            course_id: session.course_id,
            tutor_id: session.tutor_id,
            student_id: session.student_id,
            start_time: session.start_time,
            end_time: session.end_time,
            location: session.location,
            notes: session.notes,
            status: session.status,
            payment_status: session.payment_status,
            created_at: session.created_at,
            updated_at: session.updated_at,
            session_type: session.session_type as any, // Cast to avoid type issues
            zoom_meeting_id: session.zoom_meeting_id,
            zoom_join_url: session.zoom_join_url,
            tutor: session.tutor ? {
              id: session.tutor.id,
              first_name: session.tutor.first_name,
              last_name: session.tutor.last_name,
              avatar_url: session.tutor.avatar_url
            } : undefined,
            student: session.student ? {
              id: session.student.id,
              first_name: session.student.first_name,
              last_name: session.student.last_name,
              avatar_url: session.student.avatar_url
            } : undefined
          };
          
          return {
            session: sessionData,
            otherParticipant
          };
        });

      setPendingReviews(pending);
      
      // Show the first pending review if any exist
      if (pending.length > 0 && !currentReview) {
        setCurrentReview(pending[0]);
      }
    } catch (error) {
      console.error('Error checking for pending reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewComplete = async () => {
    // Remove the completed review from pending list
    const updatedPending = pendingReviews.filter(review => 
      review.session.id !== currentReview?.session.id
    );
    setPendingReviews(updatedPending);
    
    // Show post-review notification if more reviews exist
    if (updatedPending.length > 0) {
      showRemainingReviewsNotification(updatedPending.length);
      setCurrentReview(updatedPending[0]);
    } else {
      setCurrentReview(null);
    }
  };

  const showRemainingReviewsNotification = (remainingCount: number) => {
    toast({
      title: "Review submitted!",
      description: `You have ${remainingCount} more review${remainingCount > 1 ? 's' : ''} to complete.`,
      duration: 5000,
    });
  };

  const handleReviewClose = () => {
    // Don't allow closing if there are pending reviews
    // This enforces the requirement to complete reviews
    return;
  };

  // Don't render anything if loading or no user
  if (isLoading || !user || !profile) {
    return null;
  }

  // Don't render if no pending reviews
  if (!currentReview) {
    return null;
  }

  const isUserStudent = currentReview.session.student_id === user.id;

  // Convert Profile to Tutor type for StudentReviewModal
  const tutorForModal: Tutor = {
    id: currentReview.otherParticipant.id,
    name: `${currentReview.otherParticipant.first_name} ${currentReview.otherParticipant.last_name}`,
    firstName: currentReview.otherParticipant.first_name || '',
    lastName: currentReview.otherParticipant.last_name || '',
    field: currentReview.otherParticipant.subjects?.join(', ') || 'Tutoring',
    rating: currentReview.otherParticipant.average_rating || 5,
    hourlyRate: Number(currentReview.otherParticipant.hourly_rate) || 0,
    subjects: [],
    imageUrl: currentReview.otherParticipant.avatar_url || '',
    bio: currentReview.otherParticipant.bio || '',
    graduationYear: currentReview.otherParticipant.graduation_year || ''
  };

  return (
    <>
      {isUserStudent ? (
        <StudentReviewModal
          isOpen={true}
          onClose={handleReviewClose}
          session={currentReview.session}
          tutor={tutorForModal}
          onReviewSubmitted={handleReviewComplete}
        />
      ) : (
        <TutorReviewModal
          isOpen={true}
          onClose={handleReviewClose}
          session={currentReview.session}
          student={currentReview.otherParticipant}
          onSubmitComplete={handleReviewComplete}
        />
      )}
      
      {/* Show a blocking overlay if there are pending reviews */}
      {pendingReviews.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-40 pointer-events-auto">
          <div className="absolute top-4 right-4 bg-white rounded-lg p-4 shadow-lg">
            <p className="text-sm font-medium">
              {pendingReviews.length} session review{pendingReviews.length > 1 ? 's' : ''} pending
            </p>
            <p className="text-xs text-muted-foreground">
              Please complete your reviews to continue using the platform
            </p>
          </div>
        </div>
      )}
    </>
  );
}