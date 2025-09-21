import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Session } from "@/types/session";
import { Profile } from "@/integrations/supabase/types-extension";
import { TutorReviewData } from "./TutorReviewModal";
import { CheckCircle, Star, User, Calendar, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface TutorReviewSubmissionStepProps {
  session: Session;
  student: Profile;
  reviewData: TutorReviewData;
  onComplete: () => void;
}

export function TutorReviewSubmissionStep({
  session,
  student,
  reviewData,
  onComplete
}: TutorReviewSubmissionStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    console.log('🔄 Submit button clicked!');
    console.log('🔄 Current state:', { 
      isSubmitting, 
      user: !!user, 
      userId: user?.id || 'none',
      loading, 
      sessionId: session.id,
      studentId: student.id
    });
    
    if (isSubmitting) {
      console.log('🔄 Already submitting, returning early');
      return;
    }
    
    if (loading) {
      console.log('🔄 Auth still loading, showing message');
      toast({
        title: "Please wait",
        description: "Authentication is still loading. Please try again in a moment.",
        variant: "default",
      });
      return;
    }
    
    if (!user) {
      console.error('🔄 No user found after loading complete');
      toast({
        title: "Authentication Error",
        description: "You must be logged in to submit a review. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    console.log('🔄 Starting submission...');
    setIsSubmitting(true);

    try {
      const submissionData = {
        session_id: session.id,
        student_id: session.student_id,
        tutor_id: session.tutor_id,
        tutor_showed_up: true, // Tutor is submitting, so they showed up
        student_showed_up: reviewData.student_showed_up,
        engagement_level: reviewData.engagement_level,
        came_prepared: reviewData.came_prepared,
        respectful: reviewData.respectful,
        motivation_effort: reviewData.motivation_effort,
        tutor_feedback: reviewData.feedback
      };

      console.log('🔄 Submitting review with data:', submissionData);

      const { data, error } = await supabase
        .from('student_reviews')
        .insert(submissionData)
        .select();

      if (error) {
        console.error('🔄 Database error:', error);
        
        let errorMessage = `Failed to submit review: ${error.message}`;
        
        if (error.code === '23505' && error.message.includes('unique_reviewer_session')) {
          errorMessage = "You have already submitted a review for this session.";
        } else if (error.message.includes("violates row-level security")) {
          errorMessage = "You don't have permission to submit this review. Please make sure you're the tutor for this session.";
        } else if (error.message.includes("foreign key")) {
          errorMessage = "Invalid session or user information. Please refresh and try again.";
        }
        
        toast({
          title: "Submission Error",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      console.log('🔄 Review submitted successfully:', data);
      console.log('🔄 Now confirming session completion...');
      
      // Call session confirmation API to update tutor_confirmed/student_confirmed fields
      try {
        const { data: confirmationData, error: confirmationError } = await supabase.functions.invoke(
          'confirm-session-complete',
          {
            body: { 
              sessionId: session.id, 
              userRole: 'tutor' 
            }
          }
        );

        if (confirmationError) {
          console.error("🔄 Session confirmation failed:", confirmationError);
          // Don't fail the entire process - the review was already saved successfully
          toast({
            title: "Review submitted successfully",
            description: "Review saved, but there was an issue updating session status.",
          });
        } else {
          console.log("🔄 Session confirmation successful:", confirmationData);
          const bothConfirmed = confirmationData?.bothConfirmed;
          
          toast({
            title: "Review submitted successfully",
            description: reviewData.student_showed_up 
              ? (bothConfirmed 
                  ? "Thank you for your feedback! Payment has been released." 
                  : "Thank you for your feedback! Waiting for student confirmation.")
              : "No-show has been recorded for payment processing.",
          });
        }
      } catch (confirmationError) {
        console.error("🔄 Session confirmation error:", confirmationError);
        // Don't fail the entire process
        toast({
          title: "Review submitted successfully",
          description: reviewData.student_showed_up 
            ? "Thank you for your feedback!"
            : "No-show has been recorded for payment processing.",
        });
      }

      console.log('🔄 Calling onComplete callback...');
      onComplete();
      
    } catch (error: any) {
      console.error('🔄 Unexpected error:', error);
      toast({
        title: "Unexpected Error",
        description: `An unexpected error occurred: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      console.log('🔄 Setting isSubmitting to false');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Session summary */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-usc-cardinal" />
              <span className="font-medium">Student:</span>
              <span>{student.first_name} {student.last_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-usc-cardinal" />
              <span className="font-medium">Date:</span>
              <span>{format(new Date(session.start_time), "MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-usc-cardinal" />
              <span className="font-medium">Time:</span>
              <span>
                {format(new Date(session.start_time), "h:mm a")} - {format(new Date(session.end_time), "h:mm a")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Review Summary</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">Student attendance:</span>
            <span className={reviewData.student_showed_up ? "text-green-600" : "text-red-600"}>
              {reviewData.student_showed_up ? "✓ Showed up" : "✗ Did not show up"}
            </span>
          </div>

          {reviewData.student_showed_up && (
            <>
              {reviewData.engagement_level && (
                <div className="flex items-center justify-between">
                  <span>Engagement level:</span>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < reviewData.engagement_level! ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {reviewData.came_prepared && (
                <div className="flex items-center justify-between">
                  <span>Came prepared:</span>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < reviewData.came_prepared! ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {reviewData.respectful && (
                <div className="flex items-center justify-between">
                  <span>Respectful:</span>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < reviewData.respectful! ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {reviewData.motivation_effort && (
                <div className="flex items-center justify-between">
                  <span>Motivation/effort:</span>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < reviewData.motivation_effort! ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {reviewData.feedback && (
                <div className="space-y-2">
                  <span className="font-medium">Additional feedback:</span>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    {reviewData.feedback}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Submit button */}
      <div className="flex justify-end pt-4">
        <Button 
          onClick={() => {
            console.log('🔘 Submit button physically clicked!');
            handleSubmit();
          }} 
          disabled={isSubmitting}
          size="lg"
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Submit Review
            </>
          )}
        </Button>
      </div>
    </div>
  );
}