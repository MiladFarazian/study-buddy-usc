import { useReview } from '@/contexts/ReviewContext';
import { TutorReviewModal } from './TutorReviewModal';
import { StudentReviewModal } from './StudentReviewModal';
import { Tutor } from '@/types/tutor';

export function GlobalReviewModal() {
  const { activeReview, completeReview, cancelReview } = useReview();

  console.log('🔍 [GlobalReviewModal] Rendering with activeReview:', activeReview);

  if (!activeReview) {
    console.log('🔍 [GlobalReviewModal] No activeReview, returning null');
    return null;
  }

  if (activeReview.type === 'tutor' && activeReview.student) {
    console.log('🔍 [GlobalReviewModal] Rendering TutorReviewModal with:', {
      type: activeReview.type,
      hasStudent: !!activeReview.student,
      sessionId: activeReview.session?.id,
      student: activeReview.student
    });
    return (
      <TutorReviewModal
        isOpen={true}
        onClose={cancelReview}
        session={activeReview.session}
        student={activeReview.student}
        onSubmitComplete={completeReview}
      />
    );
  }

  if (activeReview.type === 'student' && activeReview.tutor) {
    console.log('🔍 [GlobalReviewModal] Rendering StudentReviewModal with:', {
      type: activeReview.type,
      hasTutor: !!activeReview.tutor,
      sessionId: activeReview.session?.id,
      tutor: activeReview.tutor
    });
    return (
      <StudentReviewModal
        isOpen={true}
        onClose={cancelReview}
        session={activeReview.session}
        tutor={activeReview.tutor as Tutor}
        onReviewSubmitted={completeReview}
      />
    );
  }

  console.log('🔍 [GlobalReviewModal] No matching conditions, returning null. activeReview:', {
    type: activeReview?.type,
    hasStudent: !!activeReview?.student,
    hasTutor: !!activeReview?.tutor
  });
  return null;
}