import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface ReviewData {
  review_id: string;
  session_id: string;
  student_id: string;
  tutor_id: string;
  student_first_name: string | null;
  student_last_name: string | null;
  tutor_first_name: string | null;
  tutor_last_name: string | null;
  teaching_quality: number | null;
  engagement_level: number | null;
  stress_before: number | null;
  stress_after: number | null;
  student_showed_up: boolean | null;
  tutor_showed_up: boolean;
  created_at: string;
  updated_at: string;
  written_feedback: string | null;
  tutor_feedback: string | null;
}

interface ReviewsTableProps {
  onRefresh?: () => void;
}

export const ReviewsTable = ({ onRefresh }: ReviewsTableProps) => {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_reviews')
        .select(`
          review_id,
          session_id,
          student_id,
          tutor_id,
          teaching_quality,
          engagement_level,
          stress_before,
          stress_after,
          student_showed_up,
          tutor_showed_up,
          created_at,
          updated_at,
          written_feedback,
          tutor_feedback,
          sessions!inner (
            student_first_name,
            student_last_name,
            tutor_first_name,
            tutor_last_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching reviews:', error);
        return;
      }

      // Flatten the data structure
      const formattedReviews = data?.map(review => ({
        ...review,
        student_first_name: review.sessions.student_first_name,
        student_last_name: review.sessions.student_last_name,
        tutor_first_name: review.sessions.tutor_first_name,
        tutor_last_name: review.sessions.tutor_last_name,
      })) || [];

      setReviews(formattedReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleRefresh = () => {
    fetchReviews();
    onRefresh?.();
  };

  const getStudentName = (review: ReviewData) => {
    if (review.student_first_name || review.student_last_name) {
      return `${review.student_first_name || ''} ${review.student_last_name || ''}`.trim();
    }
    return 'Unknown Student';
  };

  const getTutorName = (review: ReviewData) => {
    if (review.tutor_first_name || review.tutor_last_name) {
      return `${review.tutor_first_name || ''} ${review.tutor_last_name || ''}`.trim();
    }
    return 'Unknown Tutor';
  };

  const renderRating = (rating: number | null) => {
    if (rating === null) return <span className="text-muted-foreground">-</span>;
    return (
      <Badge variant="outline" className="font-mono">
        {rating}/5
      </Badge>
    );
  };

  const renderShowUpStatus = (showedUp: boolean | null) => {
    if (showedUp === null) return <span className="text-muted-foreground">-</span>;
    return (
      <Badge variant={showedUp ? "default" : "destructive"}>
        {showedUp ? "Yes" : "No"}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Showing {reviews.length} reviews
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Tutor Name</TableHead>
              <TableHead>Teaching Quality</TableHead>
              <TableHead>Engagement</TableHead>
              <TableHead>Stress Before</TableHead>
              <TableHead>Stress After</TableHead>
              <TableHead>Student Showed</TableHead>
              <TableHead>Tutor Showed</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No reviews found
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((review) => (
                <TableRow key={review.review_id}>
                  <TableCell className="font-medium">
                    {getStudentName(review)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {getTutorName(review)}
                  </TableCell>
                  <TableCell>
                    {renderRating(review.teaching_quality)}
                  </TableCell>
                  <TableCell>
                    {renderRating(review.engagement_level)}
                  </TableCell>
                  <TableCell>
                    {renderRating(review.stress_before)}
                  </TableCell>
                  <TableCell>
                    {renderRating(review.stress_after)}
                  </TableCell>
                  <TableCell>
                    {renderShowUpStatus(review.student_showed_up)}
                  </TableCell>
                  <TableCell>
                    {renderShowUpStatus(review.tutor_showed_up)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(review.created_at), 'MMM d, yyyy')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};