import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShowUpVerificationStep } from "./ShowUpVerificationStep";
import { MentalHealthStep } from "./MentalHealthStep";
import { AcademicMetricsStep } from "./AcademicMetricsStep";
import { FinalFeedbackStep } from "./FinalFeedbackStep";
import { DisputeResolutionStep } from "./DisputeResolutionStep";
import { ReviewSubmissionStep } from "./ReviewSubmissionStep";
import { Session } from "@/types/session";
import { Tutor } from "@/types/tutor";
import { toast } from "sonner";
import { CheckCircle, AlertTriangle, MessageSquare, Star, Brain, BookOpen } from "lucide-react";

export enum ReviewStep {
  SHOW_UP_VERIFICATION = 0,
  DISPUTE_RESOLUTION = 1,
  MENTAL_HEALTH = 2,
  ACADEMIC_METRICS = 3,
  FINAL_FEEDBACK = 4,
  SUBMISSION = 5
}

export interface ReviewData {
  // Show-up verification
  tutorShowedUp: boolean | null;
  
  // Mental health metrics (1-10 for stress, 1-5 for others)
  stressBefore: number | null;
  stressAfter: number | null;
  confidenceImprovement: number | null;
  emotionalSupport: number | null;
  learningAnxietyReduction: number | null;
  overallWellbeingImpact: number | null;
  
  // Academic metrics (1-5 scale)
  teachingQuality: number | null;
  subjectClarity: number | null;
  
  // Other feedback
  writtenFeedback: string;
  feltJudged: boolean | null;
  comfortableAskingQuestions: 'very' | 'somewhat' | 'not_at_all' | null;
  wouldBookAgain: boolean | null;
}

interface StudentReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
  tutor: Tutor;
  onReviewSubmitted?: () => void;
}

export function StudentReviewModal({
  isOpen,
  onClose,
  session,
  tutor,
  onReviewSubmitted
}: StudentReviewModalProps) {
  const [currentStep, setCurrentStep] = useState<ReviewStep>(ReviewStep.SHOW_UP_VERIFICATION);
  const [reviewData, setReviewData] = useState<ReviewData>({
    tutorShowedUp: null,
    stressBefore: null,
    stressAfter: null,
    confidenceImprovement: null,
    emotionalSupport: null,
    learningAnxietyReduction: null,
    overallWellbeingImpact: null,
    teachingQuality: null,
    subjectClarity: null,
    writtenFeedback: "",
    feltJudged: null,
    comfortableAskingQuestions: null,
    wouldBookAgain: null
  });

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(ReviewStep.SHOW_UP_VERIFICATION);
      setReviewData({
        tutorShowedUp: null,
        stressBefore: null,
        stressAfter: null,
        confidenceImprovement: null,
        emotionalSupport: null,
        learningAnxietyReduction: null,
        overallWellbeingImpact: null,
        teachingQuality: null,
        subjectClarity: null,
        writtenFeedback: "",
        feltJudged: null,
        comfortableAskingQuestions: null,
        wouldBookAgain: null
      });
    }
  }, [isOpen]);

  const updateReviewData = (updates: Partial<ReviewData>) => {
    setReviewData(prev => ({ ...prev, ...updates }));
  };

  const handleShowUpResponse = (showedUp: boolean) => {
    updateReviewData({ tutorShowedUp: showedUp });
    
    if (showedUp) {
      // Tutor showed up - proceed to mental health evaluation
      setCurrentStep(ReviewStep.MENTAL_HEALTH);
      toast.success("Great! Let's continue with your session feedback.");
    } else {
      // Tutor did not show up - go to dispute resolution
      setCurrentStep(ReviewStep.DISPUTE_RESOLUTION);
      toast.info("We'll help you resolve this issue.");
    }
  };

  const handleNextStep = () => {
    switch (currentStep) {
      case ReviewStep.MENTAL_HEALTH:
        setCurrentStep(ReviewStep.ACADEMIC_METRICS);
        break;
      case ReviewStep.ACADEMIC_METRICS:
        setCurrentStep(ReviewStep.FINAL_FEEDBACK);
        break;
      case ReviewStep.FINAL_FEEDBACK:
        setCurrentStep(ReviewStep.SUBMISSION);
        break;
      default:
        break;
    }
  };

  const handlePreviousStep = () => {
    switch (currentStep) {
      case ReviewStep.ACADEMIC_METRICS:
        setCurrentStep(ReviewStep.MENTAL_HEALTH);
        break;
      case ReviewStep.FINAL_FEEDBACK:
        setCurrentStep(ReviewStep.ACADEMIC_METRICS);
        break;
      case ReviewStep.SUBMISSION:
        setCurrentStep(ReviewStep.FINAL_FEEDBACK);
        break;
      default:
        break;
    }
  };

  const getStepIcon = (step: ReviewStep) => {
    switch (step) {
      case ReviewStep.SHOW_UP_VERIFICATION:
        return <CheckCircle className="h-5 w-5" />;
      case ReviewStep.DISPUTE_RESOLUTION:
        return <AlertTriangle className="h-5 w-5" />;
      case ReviewStep.MENTAL_HEALTH:
        return <Brain className="h-5 w-5" />;
      case ReviewStep.ACADEMIC_METRICS:
        return <BookOpen className="h-5 w-5" />;
      case ReviewStep.FINAL_FEEDBACK:
        return <MessageSquare className="h-5 w-5" />;
      case ReviewStep.SUBMISSION:
        return <Star className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case ReviewStep.SHOW_UP_VERIFICATION:
        return "Session Verification";
      case ReviewStep.DISPUTE_RESOLUTION:
        return "Report Issue";
      case ReviewStep.MENTAL_HEALTH:
        return "Well-being Assessment";
      case ReviewStep.ACADEMIC_METRICS:
        return "Academic Evaluation";
      case ReviewStep.FINAL_FEEDBACK:
        return "Additional Feedback";
      case ReviewStep.SUBMISSION:
        return "Submit Review";
      default:
        return "Review Session";
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case ReviewStep.SHOW_UP_VERIFICATION:
        return (
          <ShowUpVerificationStep
            tutor={tutor}
            session={session}
            onResponse={handleShowUpResponse}
          />
        );
      case ReviewStep.DISPUTE_RESOLUTION:
        return (
          <DisputeResolutionStep
            session={session}
            tutor={tutor}
            onClose={onClose}
          />
        );
      case ReviewStep.MENTAL_HEALTH:
        return (
          <MentalHealthStep
            reviewData={reviewData}
            onUpdate={updateReviewData}
            onNext={handleNextStep}
            onBack={() => setCurrentStep(ReviewStep.SHOW_UP_VERIFICATION)}
          />
        );
      case ReviewStep.ACADEMIC_METRICS:
        return (
          <AcademicMetricsStep
            reviewData={reviewData}
            onUpdate={updateReviewData}
            onNext={handleNextStep}
            onBack={handlePreviousStep}
          />
        );
      case ReviewStep.FINAL_FEEDBACK:
        return (
          <FinalFeedbackStep
            reviewData={reviewData}
            onUpdate={updateReviewData}
            onNext={handleNextStep}
            onBack={handlePreviousStep}
          />
        );
      case ReviewStep.SUBMISSION:
        return (
          <ReviewSubmissionStep
            session={session}
            tutor={tutor}
            reviewData={reviewData}
            onBack={handlePreviousStep}
            onSubmitted={() => {
              onReviewSubmitted?.();
              onClose();
            }}
          />
        );
      default:
        return null;
    }
  };

  // Show progress for normal flow (when tutor showed up)
  const showProgress = reviewData.tutorShowedUp === true && currentStep !== ReviewStep.DISPUTE_RESOLUTION;
  const progressSteps = [ReviewStep.MENTAL_HEALTH, ReviewStep.ACADEMIC_METRICS, ReviewStep.FINAL_FEEDBACK, ReviewStep.SUBMISSION];
  const currentProgressIndex = progressSteps.indexOf(currentStep);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {getStepIcon(currentStep)}
            {getStepTitle()}
          </DialogTitle>
        </DialogHeader>

        {/* Progress indicators for normal flow */}
        {showProgress && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                {progressSteps.map((step, index) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                        index <= currentProgressIndex
                          ? "bg-usc-cardinal text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index <= currentProgressIndex ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    {index < progressSteps.length - 1 && (
                      <Separator
                        className={`h-0.5 w-12 mx-2 ${
                          index < currentProgressIndex ? "bg-usc-cardinal" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Well-being</span>
                <span>Academic</span>
                <span>Feedback</span>
                <span>Submit</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step content */}
        <div className="space-y-6">
          {renderStepContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
