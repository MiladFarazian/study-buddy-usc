import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ReviewData } from "./StudentReviewModal";
import { BookOpen, Lightbulb, GraduationCap } from "lucide-react";

interface AcademicMetricsStepProps {
  reviewData: ReviewData;
  onUpdate: (updates: Partial<ReviewData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function AcademicMetricsStep({
  reviewData,
  onUpdate,
  onNext,
  onBack
}: AcademicMetricsStepProps) {
  const isStepComplete = () => {
    return (
      reviewData.teachingQuality !== null &&
      reviewData.subjectClarity !== null
    );
  };

  const getQualityLabel = (value: number | null) => {
    if (value === null) return "Not selected";
    if (value === 1) return "Poor";
    if (value === 2) return "Fair";
    if (value === 3) return "Good";
    if (value === 4) return "Very Good";
    return "Excellent";
  };

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800">Academic Evaluation</h3>
              <p className="text-sm text-green-700">
                Rate the academic quality and effectiveness of your tutoring session.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Teaching Effectiveness (1-5 scale)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Teaching quality */}
          <div>
            <label className="text-sm font-medium mb-3 block flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              How would you rate the overall quality of teaching?
            </label>
            <p className="text-xs text-muted-foreground mb-4">
              Consider factors like preparation, engagement, patience, and teaching methods
            </p>
            <div className="space-y-3">
              <Slider
                value={reviewData.teachingQuality ? [reviewData.teachingQuality] : [3]}
                onValueChange={(value) => onUpdate({ teachingQuality: Math.round(value[0]) })}
                max={5}
                min={1}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 - Poor</span>
                <span className="font-medium text-foreground">
                  {reviewData.teachingQuality || 3} - {getQualityLabel(reviewData.teachingQuality || 3)}
                </span>
                <span>5 - Excellent</span>
              </div>
            </div>
          </div>

          {/* Subject clarity */}
          <div>
            <label className="text-sm font-medium mb-3 block flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              How clearly did your tutor explain the subject material?
            </label>
            <p className="text-xs text-muted-foreground mb-4">
              Rate how well concepts were explained and made understandable
            </p>
            <div className="space-y-3">
              <Slider
                value={reviewData.subjectClarity ? [reviewData.subjectClarity] : [3]}
                onValueChange={(value) => onUpdate({ subjectClarity: Math.round(value[0]) })}
                max={5}
                min={1}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 - Very Unclear</span>
                <span className="font-medium text-foreground">
                  {reviewData.subjectClarity || 3} - {getQualityLabel(reviewData.subjectClarity || 3)}
                </span>
                <span>5 - Crystal Clear</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick academic insights */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Your Academic Progress</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-blue-700">Teaching Quality:</span>
              <span className="font-medium text-blue-800">
                {getQualityLabel(reviewData.teachingQuality || 3)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-700">Subject Clarity:</span>
              <span className="font-medium text-blue-800">
                {getQualityLabel(reviewData.subjectClarity || 3)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back to Well-being
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!isStepComplete()}
          className="flex-1"
        >
          Continue to Final Feedback
        </Button>
      </div>
    </div>
  );
}