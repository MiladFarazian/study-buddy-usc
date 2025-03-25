
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "@/hooks/useAuthState";

interface AddReviewFormProps {
  tutorId: string;
  onReviewAdded: () => void;
}

export const AddReviewForm = ({ tutorId, onReviewAdded }: AddReviewFormProps) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthState();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to leave a review",
        variant: "destructive",
      });
      return;
    }

    if (rating < 1 || rating > 5) {
      toast({
        title: "Invalid rating",
        description: "Please select a rating between 1 and 5",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("reviews").insert({
        tutor_id: tutorId,
        reviewer_id: user.id,
        rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
      
      // Reset form
      setRating(5);
      setComment("");
      
      // Notify parent component to refresh reviews
      onReviewAdded();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: "Failed to submit your review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-6 border-t pt-6">
      <h3 className="text-lg font-semibold">Leave a Review</h3>
      
      <div className="space-y-2">
        <Label>Rating</Label>
        <RadioGroup 
          value={rating.toString()} 
          onValueChange={(value) => setRating(parseInt(value))}
          className="flex space-x-2"
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <div key={value} className="flex items-center space-x-1">
              <RadioGroupItem value={value.toString()} id={`rating-${value}`} className="sr-only" />
              <Label
                htmlFor={`rating-${value}`}
                className={`cursor-pointer p-1 rounded-full hover:bg-gray-100 ${
                  rating >= value ? "text-usc-gold" : "text-gray-300"
                }`}
                onClick={() => setRating(value)}
              >
                <Star className={`h-6 w-6 ${rating >= value ? "fill-usc-gold" : ""}`} />
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="comment">Your Review (Optional)</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this tutor..."
          className="min-h-[100px]"
        />
      </div>
      
      <Button type="submit" disabled={isSubmitting || !user}>
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </Button>
      
      {!user && (
        <p className="text-sm text-muted-foreground mt-2">
          Please sign in to leave a review
        </p>
      )}
    </form>
  );
};
