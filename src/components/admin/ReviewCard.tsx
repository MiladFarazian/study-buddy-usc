import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StarRating from "@/components/ui/StarRating";
import { StudentReviewWithNames } from "@/hooks/useStudentReviews";
import { format } from "date-fns";

interface ReviewCardProps {
  review: StudentReviewWithNames;
}

const ReviewCard = ({ review }: ReviewCardProps) => {
  const formatName = (firstName: string | null, lastName: string | null) => {
    if (!firstName && !lastName) return "Unknown";
    return `${firstName || ""} ${lastName || ""}`.trim();
  };

  const studentName = formatName(review.student_first_name, review.student_last_name);
  const tutorName = formatName(review.tutor_first_name, review.tutor_last_name);

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

  const getBorderColor = () => {
    const hasStudentReview = review.teaching_quality !== null;
    const hasTutorReview = review.engagement_level !== null;
    
    if (hasStudentReview && hasTutorReview) return 'border-l-green-500'; // Complete
    if (hasStudentReview || hasTutorReview) return 'border-l-yellow-500'; // Partial
    return 'border-l-red-500'; // None
  };

  const getCompletionStatus = () => {
    const hasTeachingQuality = review.teaching_quality !== null;
    const hasWrittenFeedback = review.written_feedback && review.written_feedback.trim().length > 0;
    const hasStressData = review.stress_before !== null && review.stress_after !== null;
    
    if (hasTeachingQuality && hasWrittenFeedback && hasStressData) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Complete</Badge>;
    } else if (hasTeachingQuality || hasWrittenFeedback) {
      return <Badge variant="secondary">Partial</Badge>;
    } else {
      return <Badge variant="destructive">Incomplete</Badge>;
    }
  };

  const getStressReduction = (before: number | null, after: number | null) => {
    if (before === null || after === null) return "No data";
    const reduction = before - after;
    const color = reduction > 0 ? 'text-green-600' : reduction < 0 ? 'text-red-600' : 'text-gray-600';
    return (
      <span className={color}>
        ({reduction > 0 ? '+' : ''}{reduction})
      </span>
    );
  };

  return (
    <Card className={`mb-4 border-l-4 ${getBorderColor()}`}>
      <CardContent className="p-6">
        {/* Session Header Section */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b">
          <div>
            <h3 className="text-lg font-semibold">
              {studentName} ↔ {tutorName}
            </h3>
            <p className="text-sm text-muted-foreground">
              Session {review.session_id.slice(-8)} • {format(new Date(review.created_at), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="flex gap-2">
            {getCompletionStatus()}
          </div>
        </div>

        {/* Dual Review Sections Layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* LEFT SIDE - Student Review */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-blue-50">Student Review</Badge>
              <span className="text-sm text-muted-foreground">({studentName} → {tutorName})</span>
            </div>
            
            {/* Teaching Quality */}
            {review.teaching_quality && (
              <div className="flex justify-between items-center">
                <span className="text-sm">Teaching Quality:</span>
                <div className="flex items-center gap-2">
                  <StarRating rating={review.teaching_quality} showValue={false} className="scale-75" />
                  <span className="text-sm font-medium">{review.teaching_quality}/5</span>
                </div>
              </div>
            )}
            
            {/* Subject Clarity */}
            {review.subject_clarity && (
              <div className="flex justify-between items-center">
                <span className="text-sm">Subject Clarity:</span>
                <div className="flex items-center gap-2">
                  <StarRating rating={review.subject_clarity} showValue={false} className="scale-75" />
                  <span className="text-sm font-medium">{review.subject_clarity}/5</span>
                </div>
              </div>
            )}

            {/* Stress Impact */}
            {review.stress_before !== null && review.stress_after !== null && (
              <div className="flex justify-between items-center">
                <span className="text-sm">Stress Impact:</span>
                <span className="text-sm font-medium">
                  {review.stress_before} → {review.stress_after} 
                  {getStressReduction(review.stress_before, review.stress_after)}
                </span>
              </div>
            )}

            {/* Would Book Again */}
            {review.would_book_again !== null && (
              <div className="flex justify-between items-center">
                <span className="text-sm">Would Book Again:</span>
                <Badge variant={review.would_book_again ? 'default' : 'secondary'}>
                  {review.would_book_again ? 'Yes' : 'No'}
                </Badge>
              </div>
            )}
            
            {/* Written Feedback */}
            {review.written_feedback && (
              <div className="mt-3 p-3 bg-muted rounded-md">
                <p className="text-sm italic">"{review.written_feedback}"</p>
              </div>
            )}
            
            {/* Tutor Attendance */}
            <div className="flex justify-between items-center">
              <span className="text-sm">Tutor Attendance:</span>
              {getAttendanceStatus(review.tutor_showed_up)}
            </div>
          </div>

          {/* RIGHT SIDE - Tutor Review */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-green-50">Tutor Review</Badge>
              <span className="text-sm text-muted-foreground">({tutorName} → {studentName})</span>
            </div>
            
            {/* Engagement Level */}
            {review.engagement_level && (
              <div className="flex justify-between items-center">
                <span className="text-sm">Engagement Level:</span>
                <div className="flex items-center gap-2">
                  <StarRating rating={review.engagement_level} showValue={false} className="scale-75" />
                  <span className="text-sm font-medium">{review.engagement_level}/5</span>
                </div>
              </div>
            )}

            {/* Came Prepared */}
            {review.came_prepared && (
              <div className="flex justify-between items-center">
                <span className="text-sm">Came Prepared:</span>
                <div className="flex items-center gap-2">
                  <StarRating rating={review.came_prepared} showValue={false} className="scale-75" />
                  <span className="text-sm font-medium">{review.came_prepared}/5</span>
                </div>
              </div>
            )}

            {/* Respectful */}
            {review.respectful && (
              <div className="flex justify-between items-center">
                <span className="text-sm">Respectful:</span>
                <div className="flex items-center gap-2">
                  <StarRating rating={review.respectful} showValue={false} className="scale-75" />
                  <span className="text-sm font-medium">{review.respectful}/5</span>
                </div>
              </div>
            )}

            {/* Motivation/Effort */}
            {review.motivation_effort && (
              <div className="flex justify-between items-center">
                <span className="text-sm">Motivation/Effort:</span>
                <div className="flex items-center gap-2">
                  <StarRating rating={review.motivation_effort} showValue={false} className="scale-75" />
                  <span className="text-sm font-medium">{review.motivation_effort}/5</span>
                </div>
              </div>
            )}
            
            {/* Student Attendance */}
            <div className="flex justify-between items-center">
              <span className="text-sm">Student Attendance:</span>
              {getAttendanceStatus(review.student_showed_up)}
            </div>
            
            {/* Tutor Feedback */}
            {review.tutor_feedback && (
              <div className="mt-3 p-3 bg-muted rounded-md">
                <p className="text-sm italic">"{review.tutor_feedback}"</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewCard;