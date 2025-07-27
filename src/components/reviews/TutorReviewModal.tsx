import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Session } from "@/types/session";
import { Profile } from "@/integrations/supabase/types-extension";
import { TutorShowUpVerificationStep } from "./TutorShowUpVerificationStep";
import { StudentEvaluationStep } from "./StudentEvaluationStep";
import { TutorReviewSubmissionStep } from "./TutorReviewSubmissionStep";

export enum TutorReviewStep {
  SHOW_UP_VERIFICATION = "show_up_verification",
  STUDENT_EVALUATION = "student_evaluation",
  SUBMISSION = "submission"
}

export interface TutorReviewData {
  student_showed_up: boolean;
  engagement_level?: number;
  came_prepared?: number;
  respectful?: number;
  motivation_effort?: number;
  feedback?: string;
}

interface TutorReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
  student: Profile;
  onSubmitComplete: () => void;
}

export function TutorReviewModal({
  isOpen,
  onClose,
  session,
  student,
  onSubmitComplete
}: TutorReviewModalProps) {
  const [currentStep, setCurrentStep] = useState<TutorReviewStep>(TutorReviewStep.SHOW_UP_VERIFICATION);
  const [reviewData, setReviewData] = useState<TutorReviewData>({
    student_showed_up: true
  });

  const handleShowUpResponse = (showedUp: boolean) => {
    setReviewData(prev => ({ ...prev, student_showed_up: showedUp }));
    
    if (showedUp) {
      setCurrentStep(TutorReviewStep.STUDENT_EVALUATION);
    } else {
      // Skip to submission for no-show processing
      setCurrentStep(TutorReviewStep.SUBMISSION);
    }
  };

  const handleEvaluationComplete = (evaluationData: Partial<TutorReviewData>) => {
    setReviewData(prev => ({ ...prev, ...evaluationData }));
    setCurrentStep(TutorReviewStep.SUBMISSION);
  };

  const handleSubmissionComplete = () => {
    onSubmitComplete();
    onClose();
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case TutorReviewStep.SHOW_UP_VERIFICATION:
        return (
          <TutorShowUpVerificationStep
            student={student}
            session={session}
            onResponse={handleShowUpResponse}
          />
        );
      
      case TutorReviewStep.STUDENT_EVALUATION:
        return (
          <StudentEvaluationStep
            student={student}
            onComplete={handleEvaluationComplete}
          />
        );
      
      case TutorReviewStep.SUBMISSION:
        return (
          <TutorReviewSubmissionStep
            session={session}
            student={student}
            reviewData={reviewData}
            onComplete={handleSubmissionComplete}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Session Review
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {renderCurrentStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}