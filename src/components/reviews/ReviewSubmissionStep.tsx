import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ReviewData } from "./StudentReviewModal";
import { Session } from "@/types/session";
import { Tutor } from "@/types/tutor";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  Send, 
  Brain, 
  BookOpen, 
  MessageSquare, 
  TrendingDown, 
  TrendingUp,
  Star
} from "lucide-react";

interface ReviewSubmissionStepProps {
  session: Session;
  tutor: Tutor;
  reviewData: ReviewData;
  onBack: () => void;
  onSubmitted: () => void;
}

export function ReviewSubmissionStep({
  session,
  tutor,
  reviewData,
  onBack,
  onSubmitted
}: ReviewSubmissionStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const handleSubmitReview = async () => {
    console.log("🔍 Starting review submission", { user: !!user, loading, userId: user?.id });
    
    if (loading) {
      toast({
        title: "Please wait",
        description: "Authentication is still loading. Please try again in a moment.",
      });
      return;
    }
    
    if (!user) {
      console.error("❌ Authentication failed", { user, loading });
      toast({
        title: "Authentication Error",
        description: "You must be logged in to submit a review",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    console.log("✅ Authentication verified, submitting review...");

    try {
      // Upsert the detailed review into student_reviews table
      const { error: studentReviewError } = await supabase
        .from('student_reviews')
        .upsert({
          session_id: session.id,
          student_id: user.id,
          tutor_id: tutor.id,
          tutor_showed_up: reviewData.tutorShowedUp!,
          stress_before: reviewData.stressBefore,
          stress_after: reviewData.stressAfter,
          confidence_improvement: reviewData.confidenceImprovement,
          emotional_support: reviewData.emotionalSupport,
          learning_anxiety_reduction: reviewData.learningAnxietyReduction,
          overall_wellbeing_impact: reviewData.overallWellbeingImpact,
          teaching_quality: reviewData.teachingQuality,
          subject_clarity: reviewData.subjectClarity,
          written_feedback: reviewData.writtenFeedback || null,
          felt_judged: reviewData.feltJudged,
          comfortable_asking_questions: reviewData.comfortableAskingQuestions,
          would_book_again: reviewData.wouldBookAgain
        }, { 
          onConflict: 'session_id'
        });

      if (studentReviewError) {
        console.error("Error submitting student review:", studentReviewError);
        toast({
          title: "Submission Error",
          description: "Failed to submit review. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // If tutor showed up, also create a review entry for the tutor's overall rating
      if (reviewData.tutorShowedUp && reviewData.teachingQuality && reviewData.subjectClarity) {
        // Calculate overall rating from academic metrics (teaching quality and subject clarity)
        const overallRating = Math.round((reviewData.teachingQuality + reviewData.subjectClarity) / 2);
        
        const { error: reviewError } = await supabase
          .from('reviews')
          .insert({
            tutor_id: tutor.id,
            reviewer_id: user.id,
            rating: overallRating,
            comment: reviewData.writtenFeedback || null
          });

        if (reviewError) {
          console.error("Error submitting tutor review:", reviewError);
          // Don't fail the entire process if this fails - the student review was already saved
          toast({
            title: "Review submitted successfully",
            description: "Review was recorded successfully, but there was an issue updating the tutor's rating.",
          });
        }
      }

      console.log("✅ Review submitted successfully, now confirming session completion");
      
      // Call session confirmation API to update tutor_confirmed/student_confirmed fields
      try {
        const { data: confirmationData, error: confirmationError } = await supabase.functions.invoke(
          'confirm-session-complete',
          {
            body: { 
              sessionId: session.id, 
              userRole: 'student' 
            }
          }
        );

        if (confirmationError) {
          console.error("Session confirmation failed:", confirmationError);
          // Don't fail the entire process - the review was already saved successfully
          toast({
            title: "Review submitted successfully",
            description: "Review saved, but there was an issue updating session status.",
          });
        } else {
          console.log("✅ Session confirmation successful:", confirmationData);
          const bothConfirmed = confirmationData?.bothConfirmed;
          
          toast({
            title: "Review submitted successfully",
            description: bothConfirmed 
              ? "Thank you for your feedback! Payment has been released." 
              : "Thank you for your feedback! Waiting for tutor confirmation.",
          });
        }
      } catch (confirmationError) {
        console.error("Session confirmation error:", confirmationError);
        // Don't fail the entire process
        toast({
          title: "Review submitted successfully", 
          description: "Thank you for your feedback!",
        });
      }
      
      onSubmitted();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStressLevelLabel = (value: number | null) => {
    if (value === null) return "Not provided";
    if (value <= 2) return "Very Low";
    if (value <= 4) return "Low";
    if (value <= 6) return "Moderate";
    if (value <= 8) return "High";
    return "Very High";
  };

  const getImpactLabel = (value: number | null) => {
    if (value === null) return "Not provided";
    if (value === 1) return "Not at all";
    if (value === 2) return "Slightly";
    if (value === 3) return "Moderately";
    if (value === 4) return "Significantly";
    return "Extremely";
  };

  const getQualityLabel = (value: number | null) => {
    if (value === null) return "Not provided";
    if (value === 1) return "Poor";
    if (value === 2) return "Fair";
    if (value === 3) return "Good";
    if (value === 4) return "Very Good";
    return "Excellent";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Star className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800">Review Summary</h3>
              <p className="text-sm text-green-700">
                Review your feedback before submitting. This will help improve tutoring quality.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Show-up verification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Session Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span>Tutor showed up for session:</span>
            <span className={`font-semibold ${reviewData.tutorShowedUp ? 'text-green-600' : 'text-red-600'}`}>
              {reviewData.tutorShowedUp ? 'Yes' : 'No'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Mental health metrics (only show if tutor showed up) */}
      {reviewData.tutorShowedUp && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Well-being Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>Stress before session:</span>
                  <span className="font-medium">
                    {reviewData.stressBefore}/10 - {getStressLevelLabel(reviewData.stressBefore)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Stress after session:</span>
                  <span className="font-medium">
                    {reviewData.stressAfter}/10 - {getStressLevelLabel(reviewData.stressAfter)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Confidence improvement:</span>
                  <span className="font-medium">
                    {reviewData.confidenceImprovement}/5 - {getImpactLabel(reviewData.confidenceImprovement)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Emotional support:</span>
                  <span className="font-medium">
                    {reviewData.emotionalSupport}/5 - {getImpactLabel(reviewData.emotionalSupport)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Learning anxiety reduction:</span>
                  <span className="font-medium">
                    {reviewData.learningAnxietyReduction}/5 - {getImpactLabel(reviewData.learningAnxietyReduction)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Overall wellbeing impact:</span>
                  <span className="font-medium">
                    {reviewData.overallWellbeingImpact}/5 - {getImpactLabel(reviewData.overallWellbeingImpact)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Academic Evaluation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>Teaching quality:</span>
                  <span className="font-medium">
                    {reviewData.teachingQuality}/5 - {getQualityLabel(reviewData.teachingQuality)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Subject clarity:</span>
                  <span className="font-medium">
                    {reviewData.subjectClarity}/5 - {getQualityLabel(reviewData.subjectClarity)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Additional Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Felt judged during session:</span>
                  <span className="font-medium">
                    {reviewData.feltJudged === null ? 'Not answered' : reviewData.feltJudged ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Comfortable asking questions:</span>
                  <span className="font-medium capitalize">
                    {reviewData.comfortableAskingQuestions?.replace('_', ' ') || 'Not answered'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Would book again:</span>
                  <span className="font-medium">
                    {reviewData.wouldBookAgain === null ? 'Not answered' : reviewData.wouldBookAgain ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
              
              {reviewData.writtenFeedback && (
                <>
                  <Separator />
                  <div>
                    <span className="text-sm font-medium">Written feedback:</span>
                    <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded-md">
                      {reviewData.writtenFeedback}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Impact summary for positive reviews */}
      {reviewData.tutorShowedUp && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Impact Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-blue-600" />
                <span className="text-blue-700">
                  Stress change: {reviewData.stressBefore} → {reviewData.stressAfter}
                  {reviewData.stressAfter && reviewData.stressBefore && reviewData.stressAfter < reviewData.stressBefore && 
                    <span className="text-green-600 ml-1">↓ Improved</span>
                  }
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-blue-700">
                  Academic quality: {getQualityLabel(reviewData.teachingQuality)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back to Edit
        </Button>
        <Button 
          onClick={handleSubmitReview} 
          disabled={isSubmitting || loading}
          className="flex-1"
        >
          {isSubmitting ? (
            "Submitting..."
          ) : loading ? (
            "Loading..."
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Submit Review
            </>
          )}
        </Button>
      </div>
    </div>
  );
}