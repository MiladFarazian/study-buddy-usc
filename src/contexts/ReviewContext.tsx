import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Session } from '@/types/session';
import { Profile } from '@/integrations/supabase/types-extension';
import { TutorReviewStep, TutorReviewData } from '@/components/reviews/TutorReviewModal';

interface ActiveReview {
  id: string;
  type: 'student' | 'tutor';
  session: Session;
  currentStep: TutorReviewStep | string;
  reviewData: any;
  student?: Profile;
  tutor?: any;
}

interface ReviewContextType {
  activeReview: ActiveReview | null;
  startTutorReview: (session: Session, student: Profile) => void;
  startStudentReview: (session: Session, tutor: any) => void;
  updateReviewStep: (step: TutorReviewStep | string) => void;
  updateReviewData: (data: any) => void;
  completeReview: () => void;
  cancelReview: () => void;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export function ReviewProvider({ children }: { children: ReactNode }) {
  const [activeReview, setActiveReview] = useState<ActiveReview | null>(null);

  const startTutorReview = (session: Session, student: Profile) => {
    setActiveReview({
      id: `tutor-${session.id}`,
      type: 'tutor',
      session,
      student,
      currentStep: TutorReviewStep.SHOW_UP_VERIFICATION,
      reviewData: { student_showed_up: true }
    });
  };

  const startStudentReview = (session: Session, tutor: any) => {
    setActiveReview({
      id: `student-${session.id}`,
      type: 'student',
      session,
      tutor,
      currentStep: 'show_up_verification',
      reviewData: { tutor_showed_up: true }
    });
  };

  const updateReviewStep = (step: TutorReviewStep | string) => {
    if (activeReview) {
      setActiveReview(prev => prev ? { ...prev, currentStep: step } : null);
    }
  };

  const updateReviewData = (data: any) => {
    if (activeReview) {
      setActiveReview(prev => prev ? { 
        ...prev, 
        reviewData: { ...prev.reviewData, ...data }
      } : null);
    }
  };

  const completeReview = () => {
    console.log('🎯 Completing review, clearing active review state');
    setActiveReview(null);
  };

  const cancelReview = () => {
    console.log('🎯 Cancelling review, clearing active review state');
    setActiveReview(null);
  };

  return (
    <ReviewContext.Provider value={{
      activeReview,
      startTutorReview,
      startStudentReview,
      updateReviewStep,
      updateReviewData,
      completeReview,
      cancelReview
    }}>
      {children}
    </ReviewContext.Provider>
  );
}

export function useReview() {
  const context = useContext(ReviewContext);
  if (context === undefined) {
    throw new Error('useReview must be used within a ReviewProvider');
  }
  return context;
}