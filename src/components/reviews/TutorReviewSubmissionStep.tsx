import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Session } from "@/types/session";
import { Profile } from "@/integrations/supabase/types-extension";
import { TutorReviewData } from "./TutorReviewModal";
import { CheckCircle, Star, User, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "@/hooks/useAuthState";

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
  const { user } = useAuthState();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to submit your review",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Insert tutor review into student_reviews table (from tutor perspective)
      const reviewRecord = {
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

      const { error } = await supabase
        .from("student_reviews")
        .insert(reviewRecord);

      if (error) throw error;

      toast({
        title: "Review submitted successfully",
        description: reviewData.student_showed_up 
          ? "Thank you for your feedback!"
          : "No-show has been recorded for payment processing.",
      });

      onComplete();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: "Failed to submit your review. Please try again.",
        variant: "destructive",
      });
    } finally {
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
          onClick={handleSubmit} 
          disabled={isSubmitting}
          size="lg"
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            "Submitting..."
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