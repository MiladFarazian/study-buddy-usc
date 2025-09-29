import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import StarRating from "@/components/ui/StarRating";
import { useStudentReviews, StudentReviewWithNames } from "@/hooks/useStudentReviews";
import { format } from "date-fns";

interface ReviewsTableProps {
  onRefresh?: () => void;
}

export const ReviewsTable = ({ onRefresh }: ReviewsTableProps) => {
  const { reviews, loading, error } = useStudentReviews();

  const formatName = (firstName: string | null, lastName: string | null) => {
    if (!firstName && !lastName) return "Unknown";
    return `${firstName || ""} ${lastName || ""}`.trim();
  };

  const getAttendanceStatus = (showedUp: boolean | null) => {
    if (showedUp === null) return <Badge variant="secondary">Unknown</Badge>;
    return showedUp ? (
      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
        Present
      </Badge>
    ) : (
      <Badge variant="destructive">Absent</Badge>
    );
  };

  const formatRating = (rating: number | null, label: string) => {
    if (rating === null) return <span className="text-muted-foreground text-sm">Not rated</span>;
    return (
      <div className="flex items-center gap-2">
        <StarRating rating={rating} showValue={false} className="scale-75" />
        <span className="text-xs text-muted-foreground">{rating}/5</span>
      </div>
    );
  };

  const formatBoolean = (value: boolean | null, trueText: string, falseText: string) => {
    if (value === null) return <span className="text-muted-foreground text-sm">Unknown</span>;
    return (
      <Badge variant={value ? "default" : "secondary"} className="text-xs">
        {value ? trueText : falseText}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error loading reviews: {error}</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No reviews found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.review_id} className="rounded-lg border bg-card">
          {/* Session Header */}
          <div className="border-b bg-muted/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="font-mono text-sm font-medium">
                  Session: {review.session_id.slice(-8)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Student: {formatName(review.student_first_name, review.student_last_name)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Tutor: {formatName(review.tutor_first_name, review.tutor_last_name)}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(review.created_at), 'MMM d, yyyy')}
              </div>
            </div>
          </div>

          {/* Side by Side Content */}
          <div className="grid grid-cols-2 divide-x">
            {/* Student Review Data */}
            <div className="p-6">
              <h4 className="font-semibold text-sm mb-4 text-blue-700">Student Review</h4>
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Teaching Quality:</span>
                  <div className="mt-1">{formatRating(review.teaching_quality, "Teaching Quality")}</div>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Subject Clarity:</span>
                  <div className="mt-1">{formatRating(review.subject_clarity, "Subject Clarity")}</div>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Engagement Level:</span>
                  <div className="mt-1">{formatRating(review.engagement_level, "Engagement")}</div>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Stress Change:</span>
                  <div className="mt-1">
                    {review.stress_before !== null && review.stress_after !== null ? (
                      <div className="flex items-center gap-1">
                        <span className="text-sm">
                          {review.stress_before} → {review.stress_after}
                        </span>
                        <Badge variant={review.stress_before > review.stress_after ? "default" : "secondary"} className="text-xs">
                          {review.stress_before > review.stress_after ? '-' : '+'}{Math.abs(review.stress_before - review.stress_after)}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No data</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Confidence Improvement:</span>
                  <div className="mt-1">{formatRating(review.confidence_improvement, "Confidence")}</div>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Emotional Support:</span>
                  <div className="mt-1">{formatRating(review.emotional_support, "Emotional Support")}</div>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Learning Anxiety Reduction:</span>
                  <div className="mt-1">{formatRating(review.learning_anxiety_reduction, "Anxiety Reduction")}</div>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Overall Wellbeing Impact:</span>
                  <div className="mt-1">{formatRating(review.overall_wellbeing_impact, "Wellbeing")}</div>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Felt Judged:</span>
                  <div className="mt-1">{formatBoolean(review.felt_judged, "Yes", "No")}</div>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Comfortable Asking Questions:</span>
                  <div className="mt-1">
                    {review.comfortable_asking_questions ? (
                      <Badge variant="default" className="text-xs">{review.comfortable_asking_questions}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not answered</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Would Book Again:</span>
                  <div className="mt-1">{formatBoolean(review.would_book_again, "Yes", "No")}</div>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Student Showed Up:</span>
                  <div className="mt-1">{getAttendanceStatus(review.student_showed_up)}</div>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Written Feedback:</span>
                  <div className="mt-1">
                    {review.written_feedback ? (
                      <p className="text-sm bg-muted/30 p-2 rounded text-wrap">
                        {review.written_feedback}
                      </p>
                    ) : (
                      <span className="text-muted-foreground text-sm">No feedback</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tutor Review Data */}
            <div className="p-6">
              <h4 className="font-semibold text-sm mb-4 text-green-700">Tutor Review</h4>
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Student Came Prepared:</span>
                  <div className="mt-1">{formatRating(review.came_prepared, "Preparation")}</div>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Student Respectful:</span>
                  <div className="mt-1">{formatRating(review.respectful, "Respectfulness")}</div>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Student Motivation/Effort:</span>
                  <div className="mt-1">{formatRating(review.motivation_effort, "Motivation")}</div>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Tutor Showed Up:</span>
                  <div className="mt-1">{getAttendanceStatus(review.tutor_showed_up)}</div>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Tutor Feedback:</span>
                  <div className="mt-1">
                    {review.tutor_feedback ? (
                      <p className="text-sm bg-muted/30 p-2 rounded text-wrap">
                        {review.tutor_feedback}
                      </p>
                    ) : (
                      <span className="text-muted-foreground text-sm">No feedback</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};