import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ReviewData } from "./StudentReviewModal";
import { MessageSquare, ThumbsUp, ThumbsDown, Users, RefreshCw } from "lucide-react";

interface FinalFeedbackStepProps {
  reviewData: ReviewData;
  onUpdate: (updates: Partial<ReviewData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function FinalFeedbackStep({
  reviewData,
  onUpdate,
  onNext,
  onBack
}: FinalFeedbackStepProps) {
  return (
    <div className="space-y-6">
      {/* Introduction */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-purple-600" />
            <div>
              <h3 className="font-semibold text-purple-800">Additional Feedback</h3>
              <p className="text-sm text-purple-700">
                Share any additional thoughts about your tutoring experience.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Written feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Written Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Share any additional comments about your session (optional)
            </label>
            <Textarea
              placeholder="What went well? What could be improved? Any specific feedback for your tutor?"
              value={reviewData.writtenFeedback}
              onChange={(e) => onUpdate({ writtenFeedback: e.target.value })}
              rows={4}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Your feedback helps tutors improve and helps other students make informed choices.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick yes/no questions */}
      <Card>
        <CardHeader>
          <CardTitle>Session Experience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Felt judged */}
          <div>
            <label className="text-sm font-medium mb-3 block">
              Did you feel judged or uncomfortable during the session?
            </label>
            <div className="flex gap-3">
              <Button
                variant={reviewData.feltJudged === false ? "default" : "outline"}
                onClick={() => onUpdate({ feltJudged: false })}
                className="flex-1"
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                No, felt comfortable
              </Button>
              <Button
                variant={reviewData.feltJudged === true ? "destructive" : "outline"}
                onClick={() => onUpdate({ feltJudged: true })}
                className="flex-1"
              >
                <ThumbsDown className="h-4 w-4 mr-2" />
                Yes, felt judged
              </Button>
            </div>
          </div>

          {/* Comfortable asking questions */}
          <div>
            <label className="text-sm font-medium mb-3 block">
              How comfortable did you feel asking questions?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                variant={reviewData.comfortableAskingQuestions === "very" ? "default" : "outline"}
                onClick={() => onUpdate({ comfortableAskingQuestions: "very" })}
                className="h-auto py-3"
              >
                <div className="text-center">
                  <Users className="h-4 w-4 mx-auto mb-1" />
                  <div className="text-xs">Very Comfortable</div>
                </div>
              </Button>
              <Button
                variant={reviewData.comfortableAskingQuestions === "somewhat" ? "default" : "outline"}
                onClick={() => onUpdate({ comfortableAskingQuestions: "somewhat" })}
                className="h-auto py-3"
              >
                <div className="text-center">
                  <Users className="h-4 w-4 mx-auto mb-1" />
                  <div className="text-xs">Somewhat Comfortable</div>
                </div>
              </Button>
              <Button
                variant={reviewData.comfortableAskingQuestions === "not_at_all" ? "destructive" : "outline"}
                onClick={() => onUpdate({ comfortableAskingQuestions: "not_at_all" })}
                className="h-auto py-3"
              >
                <div className="text-center">
                  <Users className="h-4 w-4 mx-auto mb-1" />
                  <div className="text-xs">Not Comfortable</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Would book again */}
          <div>
            <label className="text-sm font-medium mb-3 block">
              Would you book another session with this tutor?
            </label>
            <div className="flex gap-3">
              <Button
                variant={reviewData.wouldBookAgain === true ? "default" : "outline"}
                onClick={() => onUpdate({ wouldBookAgain: true })}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Yes, definitely
              </Button>
              <Button
                variant={reviewData.wouldBookAgain === false ? "outline" : "outline"}
                onClick={() => onUpdate({ wouldBookAgain: false })}
                className="flex-1"
              >
                <ThumbsDown className="h-4 w-4 mr-2" />
                No, prefer different tutor
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back to Academic Assessment
        </Button>
        <Button onClick={onNext} className="flex-1">
          Review & Submit
        </Button>
      </div>
    </div>
  );
}