import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import StarRating from "@/components/ui/StarRating";
import { useSessionReview } from "@/hooks/useSessionReview";
import { useAuth } from "@/contexts/AuthContext";

interface SessionReviewContentProps {
  sessionId: string;
}

export const SessionReviewContent = ({ sessionId }: SessionReviewContentProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: reviewData, isLoading, error } = useSessionReview(sessionId);
  const { isTutor } = useAuth();

  // Fallback to simple text if review fails to load
  if (isLoading) {
    return <span className="text-sm text-gray-500 px-3 py-2">Loading review...</span>;
  }

  if (error || !reviewData) {
    return <span className="text-sm text-gray-500 px-3 py-2">Review Completed</span>;
  }

  const hasStudentFeedback = reviewData.teaching_quality || reviewData.subject_clarity || reviewData.written_feedback;
  const hasTutorFeedback = reviewData.engagement_level || reviewData.came_prepared || reviewData.tutor_feedback;

  if (!hasStudentFeedback && !hasTutorFeedback) {
    return <span className="text-sm text-gray-500 px-3 py-2">Review Completed</span>;
  }

  return (
    <div className="w-full">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
      >
        Review Details
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {isExpanded && (
        <div className="mt-3 grid md:grid-cols-2 gap-4">
          {hasStudentFeedback && (
            <div className="bg-blue-50 p-4 rounded-lg border">
              <h4 className="font-medium text-sm mb-3 text-blue-900">Student Feedback</h4>
              <div className="space-y-2 text-sm">
                {reviewData.teaching_quality && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Teaching Quality:</span>
                    <StarRating rating={reviewData.teaching_quality} showValue={false} className="flex-shrink-0" />
                    <span className="text-xs text-gray-500">({reviewData.teaching_quality}/5)</span>
                  </div>
                )}
                {reviewData.subject_clarity && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Subject Clarity:</span>
                    <StarRating rating={reviewData.subject_clarity} showValue={false} className="flex-shrink-0" />
                    <span className="text-xs text-gray-500">({reviewData.subject_clarity}/5)</span>
                  </div>
                )}
                {reviewData.written_feedback && (
                  <div>
                    <span className="text-gray-600">Comments:</span>
                    <p className="italic text-gray-700 mt-1">"{reviewData.written_feedback}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {hasTutorFeedback && (
            <div className="bg-green-50 p-4 rounded-lg border">
              <h4 className="font-medium text-sm mb-3 text-green-900">
                {isTutor ? "Your Feedback" : "Tutor Feedback"}
              </h4>
              <div className="space-y-2 text-sm">
                {reviewData.engagement_level && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Engagement:</span>
                    <StarRating rating={reviewData.engagement_level} showValue={false} className="flex-shrink-0" />
                    <span className="text-xs text-gray-500">({reviewData.engagement_level}/5)</span>
                  </div>
                )}
                {reviewData.came_prepared && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Preparation:</span>
                    <StarRating rating={reviewData.came_prepared} showValue={false} className="flex-shrink-0" />
                    <span className="text-xs text-gray-500">({reviewData.came_prepared}/5)</span>
                  </div>
                )}
                {reviewData.tutor_feedback && (
                  <div>
                    <span className="text-gray-600">Comments:</span>
                    <p className="italic text-gray-700 mt-1">"{reviewData.tutor_feedback}"</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};