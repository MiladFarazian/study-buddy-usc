import { useReview } from '@/contexts/ReviewContext';
import { TutorReviewModal } from './TutorReviewModal';
import { StudentReviewModal } from './StudentReviewModal';
import { Tutor } from '@/types/tutor';

export function GlobalReviewModal() {
  const { activeReview, completeReview, cancelReview } = useReview();

  if (!activeReview) return null;

  if (activeReview.type === 'tutor' && activeReview.student) {
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

  return null;
}