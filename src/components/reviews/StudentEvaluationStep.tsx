import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, User } from "lucide-react";
import { Profile } from "@/integrations/supabase/types-extension";
import { TutorReviewData } from "./TutorReviewModal";

interface StudentEvaluationStepProps {
  student: Profile;
  onComplete: (data: Partial<TutorReviewData>) => void;
}

interface StarRatingProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

const StarRating = ({ label, value, onChange }: StarRatingProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`p-1 rounded-full hover:bg-gray-100 transition-colors ${
              value >= star ? "text-yellow-400" : "text-gray-300"
            }`}
          >
            <Star className={`h-6 w-6 ${value >= star ? "fill-yellow-400" : ""}`} />
          </button>
        ))}
      </div>
    </div>
  );
};

export function StudentEvaluationStep({ student, onComplete }: StudentEvaluationStepProps) {
  const [engagementLevel, setEngagementLevel] = useState(3);
  const [camePrepared, setCamePrepared] = useState(3);
  const [respectful, setRespectful] = useState(3);
  const [motivationEffort, setMotivationEffort] = useState(3);
  const [feedback, setFeedback] = useState("");

  const handleSubmit = () => {
    onComplete({
      engagement_level: engagementLevel,
      came_prepared: camePrepared,
      respectful,
      motivation_effort: motivationEffort,
      feedback: feedback.trim() || undefined
    });
  };

  return (
    <div className="space-y-6">
      {/* Student info header */}
      <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
        <User className="h-5 w-5 text-usc-cardinal" />
        <div>
          <h3 className="font-semibold">Student Evaluation</h3>
          <p className="text-sm text-muted-foreground">
            {student.first_name} {student.last_name}
          </p>
        </div>
      </div>

      {/* Rating questions */}
      <div className="space-y-6">
        <StarRating
          label="Student engagement level"
          value={engagementLevel}
          onChange={setEngagementLevel}
        />

        <StarRating
          label="Student came prepared"
          value={camePrepared}
          onChange={setCamePrepared}
        />

        <StarRating
          label="Student was respectful"
          value={respectful}
          onChange={setRespectful}
        />

        <StarRating
          label="Student motivation/effort"
          value={motivationEffort}
          onChange={setMotivationEffort}
        />
      </div>

      {/* Optional feedback */}
      <div className="space-y-2">
        <Label htmlFor="feedback">Additional feedback (optional)</Label>
        <Textarea
          id="feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Share any additional thoughts about the session..."
          className="min-h-[100px]"
          maxLength={300}
        />
        <div className="text-xs text-muted-foreground text-right">
          {feedback.length}/300 characters
        </div>
      </div>

      {/* Submit button */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSubmit} size="lg">
          Continue to Submit
        </Button>
      </div>
    </div>
  );
}