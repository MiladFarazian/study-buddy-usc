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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Session ID</TableHead>
            <TableHead>Student Name</TableHead>
            <TableHead>Tutor Name</TableHead>
            <TableHead>Teaching Quality</TableHead>
            <TableHead>Stress Change</TableHead>
            <TableHead>Student Attendance</TableHead>
            <TableHead>Tutor Attendance</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Feedback</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviews.map((review) => (
            <TableRow key={review.review_id}>
              <TableCell className="font-mono text-xs">
                {review.session_id.slice(-8)}
              </TableCell>
              <TableCell className="font-medium">
                {formatName(review.student_first_name, review.student_last_name)}
              </TableCell>
              <TableCell className="font-medium">
                {formatName(review.tutor_first_name, review.tutor_last_name)}
              </TableCell>
              <TableCell>
                {review.teaching_quality ? (
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.teaching_quality} showValue={false} className="scale-90" />
                    <span className="text-sm text-muted-foreground">
                      {review.teaching_quality}/5
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Not rated</span>
                )}
              </TableCell>
              <TableCell>
                {review.stress_before !== null && review.stress_after !== null ? (
                  <div className="flex items-center gap-1">
                    <span className="text-sm">
                      {review.stress_before} → {review.stress_after}
                    </span>
                    <span className={`text-xs ${
                      review.stress_before > review.stress_after 
                        ? 'text-green-600' 
                        : review.stress_before < review.stress_after 
                        ? 'text-red-600' 
                        : 'text-gray-600'
                    }`}>
                      ({review.stress_before > review.stress_after ? '-' : '+'}{Math.abs(review.stress_before - review.stress_after)})
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">No data</span>
                )}
              </TableCell>
              <TableCell>
                {getAttendanceStatus(review.student_showed_up)}
              </TableCell>
              <TableCell>
                {getAttendanceStatus(review.tutor_showed_up)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(review.created_at), 'MMM d, yyyy')}
              </TableCell>
              <TableCell className="max-w-xs">
                {review.written_feedback ? (
                  <div className="truncate text-sm" title={review.written_feedback}>
                    {review.written_feedback}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">No feedback</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};