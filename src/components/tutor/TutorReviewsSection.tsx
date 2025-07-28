
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Review } from "@/types/tutor";
import { format } from "date-fns";
import StarRating from "@/components/ui/StarRating";

interface TutorReviewsSectionProps {
  reviews: Review[];
}

export const TutorReviewsSection = ({ reviews }: TutorReviewsSectionProps) => {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Reviews</CardTitle>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <p className="text-muted-foreground py-4">
            No reviews yet. Reviews are automatically added after students complete sessions.
          </p>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="pb-4 border-b border-gray-100 last:border-b-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{review.reviewerName || "Anonymous Student"}</p>
                    <div className="flex items-center mt-1">
                      <StarRating rating={review.rating} showValue={false} />
                      <span className="ml-2 text-sm text-muted-foreground">
                        {format(new Date(review.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>
                {review.comment && <p className="text-muted-foreground mt-2">{review.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
