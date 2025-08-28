import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ReviewData } from "./StudentReviewModal";
import { Brain, TrendingDown, TrendingUp, Heart, Shield, Smile } from "lucide-react";

interface MentalHealthStepProps {
  reviewData: ReviewData;
  onUpdate: (updates: Partial<ReviewData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function MentalHealthStep({
  reviewData,
  onUpdate,
  onNext,
  onBack
}: MentalHealthStepProps) {
  const isStepComplete = () => {
    return (
      reviewData.stressBefore !== null &&
      reviewData.stressAfter !== null &&
      reviewData.confidenceImprovement !== null &&
      reviewData.emotionalSupport !== null &&
      reviewData.learningAnxietyReduction !== null &&
      reviewData.overallWellbeingImpact !== null
    );
  };

  const getStressLevelLabel = (value: number | null) => {
    if (value === null) return "Not selected";
    if (value <= 2) return "Very Low";
    if (value <= 4) return "Low";
    if (value <= 6) return "Moderate";
    if (value <= 8) return "High";
    return "Very High";
  };

  const getImpactLabel = (value: number | null) => {
    if (value === null) return "Not selected";
    if (value === 1) return "Not at all";
    if (value === 2) return "Slightly";
    if (value === 3) return "Moderately";
    if (value === 4) return "Significantly";
    return "Extremely";
  };

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-800">Well-being Assessment</h3>
              <p className="text-sm text-blue-700">
                Help us understand how this tutoring session affected your mental well-being and confidence.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stress levels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Stress Levels (1-10 scale)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-3 block">
                How stressed did you feel BEFORE the tutoring session?
              </label>
              <div className="space-y-3">
                <Slider
                  value={reviewData.stressBefore ? [reviewData.stressBefore] : [5]}
                  onValueChange={(value) => onUpdate({ stressBefore: Math.round(value[0]) })}
                  max={10}
                  min={1}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 - Very Low</span>
                  <span className="font-medium text-foreground">
                    {reviewData.stressBefore || 5} - {getStressLevelLabel(reviewData.stressBefore || 5)}
                  </span>
                  <span>10 - Very High</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">
                How stressed do you feel AFTER the tutoring session?
              </label>
              <div className="space-y-3">
                <Slider
                  value={reviewData.stressAfter ? [reviewData.stressAfter] : [5]}
                  onValueChange={(value) => onUpdate({ stressAfter: Math.round(value[0]) })}
                  max={10}
                  min={1}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 - Very Low</span>
                  <span className="font-medium text-foreground">
                    {reviewData.stressAfter || 5} - {getStressLevelLabel(reviewData.stressAfter || 5)}
                  </span>
                  <span>10 - Very High</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mental health improvements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Positive Impact Assessment (1-5 scale)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Confidence improvement */}
          <div>
            <label className="text-sm font-medium mb-3 block flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Did this session improve your confidence in the subject?
            </label>
            <div className="space-y-3">
              <Slider
                value={reviewData.confidenceImprovement ? [reviewData.confidenceImprovement] : [3]}
                onValueChange={(value) => onUpdate({ confidenceImprovement: Math.round(value[0]) })}
                max={5}
                min={1}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 - Not at all</span>
                <span className="font-medium text-foreground">
                  {reviewData.confidenceImprovement || 3} - {getImpactLabel(reviewData.confidenceImprovement || 3)}
                </span>
                <span>5 - Extremely</span>
              </div>
            </div>
          </div>

          {/* Emotional support */}
          <div>
            <label className="text-sm font-medium mb-3 block flex items-center gap-2">
              <Smile className="h-4 w-4" />
              How much emotional support did you feel from your tutor?
            </label>
            <div className="space-y-3">
              <Slider
                value={reviewData.emotionalSupport ? [reviewData.emotionalSupport] : [3]}
                onValueChange={(value) => onUpdate({ emotionalSupport: Math.round(value[0]) })}
                max={5}
                min={1}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 - None</span>
                <span className="font-medium text-foreground">
                  {reviewData.emotionalSupport || 3} - {getImpactLabel(reviewData.emotionalSupport || 3)}
                </span>
                <span>5 - Tremendous</span>
              </div>
            </div>
          </div>

          {/* Learning anxiety reduction */}
          <div>
            <label className="text-sm font-medium mb-3 block flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Did this session reduce your anxiety about learning this subject?
            </label>
            <div className="space-y-3">
              <Slider
                value={reviewData.learningAnxietyReduction ? [reviewData.learningAnxietyReduction] : [3]}
                onValueChange={(value) => onUpdate({ learningAnxietyReduction: Math.round(value[0]) })}
                max={5}
                min={1}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 - Not at all</span>
                <span className="font-medium text-foreground">
                  {reviewData.learningAnxietyReduction || 3} - {getImpactLabel(reviewData.learningAnxietyReduction || 3)}
                </span>
                <span>5 - Significantly</span>
              </div>
            </div>
          </div>

          {/* Overall wellbeing impact */}
          <div>
            <label className="text-sm font-medium mb-3 block flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Overall, how did this session impact your well-being?
            </label>
            <div className="space-y-3">
              <Slider
                value={reviewData.overallWellbeingImpact ? [reviewData.overallWellbeingImpact] : [3]}
                onValueChange={(value) => onUpdate({ overallWellbeingImpact: Math.round(value[0]) })}
                max={5}
                min={1}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 - Negative</span>
                <span className="font-medium text-foreground">
                  {reviewData.overallWellbeingImpact || 3} - {getImpactLabel(reviewData.overallWellbeingImpact || 3)}
                </span>
                <span>5 - Very Positive</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!isStepComplete()}
          className="flex-1"
        >
          Continue to Academic Assessment
        </Button>
      </div>
    </div>
  );
}