import { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import StarRating from "@/components/ui/StarRating";
import { SessionReviewData } from "@/hooks/useSessionReviews";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, User, GraduationCap, Clock, BookOpen } from "lucide-react";

interface SessionReviewCardProps {
  sessionData: SessionReviewData;
}

export const SessionReviewCard = ({ sessionData }: SessionReviewCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatName = (firstName: string | null, lastName: string | null) => {
    if (!firstName && !lastName) return "Unknown";
    return `${firstName || ""} ${lastName || ""}`.trim();
  };

  const getCompletionStatus = () => {
    const hasStudentReview = sessionData.student_review?.teaching_quality !== null;
    const hasTutorReview = sessionData.tutor_review?.engagement_level !== null;
    
    if (hasStudentReview && hasTutorReview) {
      return { status: "Complete", color: "bg-green-100 text-green-800", icon: "🟢" };
    } else if (hasStudentReview || hasTutorReview) {
      return { status: "Partial", color: "bg-yellow-100 text-yellow-800", icon: "🟡" };
    } else {
      return { status: "Incomplete", color: "bg-red-100 text-red-800", icon: "🔴" };
    }
  };

  const getStressImpact = () => {
    const before = sessionData.student_review?.stress_before;
    const after = sessionData.student_review?.stress_after;
    if (before === null || after === null) return null;
    
    const reduction = before - after;
    return {
      before,
      after,
      change: reduction,
      formatted: reduction > 0 ? `+${reduction}` : `${reduction}`,
      color: reduction > 0 ? 'text-green-600' : reduction < 0 ? 'text-red-600' : 'text-gray-600'
    };
  };

  const getConfidenceImpact = () => {
    const improvement = sessionData.student_review?.confidence_improvement;
    if (improvement === null) return null;
    
    return {
      change: improvement,
      formatted: improvement > 0 ? `+${improvement}` : `${improvement}`,
      color: improvement > 0 ? 'text-green-600' : improvement < 0 ? 'text-red-600' : 'text-gray-600'
    };
  };

  const completionStatus = getCompletionStatus();
  const stressImpact = getStressImpact();
  const confidenceImpact = getConfidenceImpact();

  return (
    <Card className="w-full">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              {/* Session Header */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="font-mono">#{sessionData.session_id.slice(-8)}</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(sessionData.session_date), 'MMM d, yyyy')}
                </span>
                <span>{sessionData.duration_hours}h</span>
              </div>
              
              {/* Participants */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">
                    {formatName(sessionData.student_first_name, sessionData.student_last_name)}
                  </span>
                </div>
                <span className="text-muted-foreground">↔</span>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">
                    {formatName(sessionData.tutor_first_name, sessionData.tutor_last_name)}
                  </span>
                </div>
              </div>
              
              {/* Course & Status */}
              <div className="flex items-center gap-4 text-sm">
                {sessionData.course_id && (
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    <span>{sessionData.course_id}</span>
                  </div>
                )}
                <Badge variant="outline" className="capitalize">
                  {sessionData.session_status}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge className={completionStatus.color}>
                {completionStatus.icon} {completionStatus.status}
              </Badge>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Quick Overview (Always Visible) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Student → Tutor Review Summary */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Student → Tutor</span>
              </div>
              
              {sessionData.student_review?.teaching_quality ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Teaching:</span>
                    <StarRating rating={sessionData.student_review.teaching_quality} showValue={true} className="scale-75" />
                  </div>
                  {stressImpact && (
                    <div className="text-sm">
                      <span>Stress: </span>
                      <span>{stressImpact.before} → {stressImpact.after}</span>
                      <span className={`ml-1 font-medium ${stressImpact.color}`}>
                        ({stressImpact.formatted})
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">No review submitted</span>
              )}
            </div>

            {/* Tutor → Student Review Summary */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-purple-800">Tutor → Student</span>
              </div>
              
              {sessionData.tutor_review?.engagement_level ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Engagement:</span>
                    <StarRating rating={sessionData.tutor_review.engagement_level} showValue={true} className="scale-75" />
                  </div>
                  {sessionData.tutor_review.came_prepared && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Prepared:</span>
                      <StarRating rating={sessionData.tutor_review.came_prepared} showValue={true} className="scale-75" />
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">No review submitted</span>
              )}
            </div>
          </div>

          {/* Detailed Reviews (Expandable) */}
          <CollapsibleContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Detailed Student Review */}
              <div className="space-y-4">
                <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Student Review (of Tutor)
                </h4>
                
                {sessionData.student_review ? (
                  <div className="space-y-3 text-sm">
                    {/* Ratings Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {sessionData.student_review.teaching_quality && (
                        <div>
                          <span className="text-muted-foreground">Teaching Quality:</span>
                          <div className="flex items-center gap-1">
                            <StarRating rating={sessionData.student_review.teaching_quality} showValue={false} className="scale-75" />
                            <span className="font-medium">{sessionData.student_review.teaching_quality}/5</span>
                          </div>
                        </div>
                      )}
                      
                      {sessionData.student_review.subject_clarity && (
                        <div>
                          <span className="text-muted-foreground">Subject Clarity:</span>
                          <div className="flex items-center gap-1">
                            <StarRating rating={sessionData.student_review.subject_clarity} showValue={false} className="scale-75" />
                            <span className="font-medium">{sessionData.student_review.subject_clarity}/5</span>
                          </div>
                        </div>
                      )}
                      
                      {sessionData.student_review.emotional_support && (
                        <div>
                          <span className="text-muted-foreground">Emotional Support:</span>
                          <div className="flex items-center gap-1">
                            <StarRating rating={sessionData.student_review.emotional_support} showValue={false} className="scale-75" />
                            <span className="font-medium">{sessionData.student_review.emotional_support}/5</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Mental Health Metrics */}
                    {(stressImpact || confidenceImpact) && (
                      <div className="space-y-2">
                        <span className="text-muted-foreground font-medium">Mental Health Impact:</span>
                        {stressImpact && (
                          <div>
                            <span>Stress: {stressImpact.before} → {stressImpact.after} </span>
                            <span className={`font-medium ${stressImpact.color}`}>
                              ({stressImpact.formatted} improvement)
                            </span>
                          </div>
                        )}
                        {confidenceImpact && (
                          <div>
                            <span>Confidence: </span>
                            <span className={`font-medium ${confidenceImpact.color}`}>
                              {confidenceImpact.formatted} improvement
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Attendance & Preferences */}
                    <div className="space-y-2">
                      <div>
                        <span className="text-muted-foreground">Tutor Attendance:</span>
                        <Badge 
                          variant={sessionData.student_review.tutor_showed_up ? "default" : "destructive"}
                          className="ml-2"
                        >
                          {sessionData.student_review.tutor_showed_up ? "Present" : "Absent"}
                        </Badge>
                      </div>
                      {sessionData.student_review.would_book_again !== null && (
                        <div>
                          <span className="text-muted-foreground">Would Book Again:</span>
                          <Badge 
                            variant={sessionData.student_review.would_book_again ? "default" : "secondary"}
                            className="ml-2"
                          >
                            {sessionData.student_review.would_book_again ? "Yes" : "No"}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Written Feedback */}
                    {sessionData.student_review.written_feedback && (
                      <div>
                        <span className="text-muted-foreground font-medium">Written Feedback:</span>
                        <p className="mt-1 p-2 bg-gray-50 rounded text-sm italic">
                          "{sessionData.student_review.written_feedback}"
                        </p>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Submitted: {format(new Date(sessionData.student_review.created_at!), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm italic">No student review submitted for this session.</p>
                )}
              </div>

              {/* Detailed Tutor Review */}
              <div className="space-y-4">
                <h4 className="font-semibold text-purple-800 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Tutor Review (of Student)
                </h4>
                
                {sessionData.tutor_review ? (
                  <div className="space-y-3 text-sm">
                    {/* Ratings Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {sessionData.tutor_review.engagement_level && (
                        <div>
                          <span className="text-muted-foreground">Engagement:</span>
                          <div className="flex items-center gap-1">
                            <StarRating rating={sessionData.tutor_review.engagement_level} showValue={false} className="scale-75" />
                            <span className="font-medium">{sessionData.tutor_review.engagement_level}/5</span>
                          </div>
                        </div>
                      )}
                      
                      {sessionData.tutor_review.came_prepared && (
                        <div>
                          <span className="text-muted-foreground">Came Prepared:</span>
                          <div className="flex items-center gap-1">
                            <StarRating rating={sessionData.tutor_review.came_prepared} showValue={false} className="scale-75" />
                            <span className="font-medium">{sessionData.tutor_review.came_prepared}/5</span>
                          </div>
                        </div>
                      )}
                      
                      {sessionData.tutor_review.respectful && (
                        <div>
                          <span className="text-muted-foreground">Respectful:</span>
                          <div className="flex items-center gap-1">
                            <StarRating rating={sessionData.tutor_review.respectful} showValue={false} className="scale-75" />
                            <span className="font-medium">{sessionData.tutor_review.respectful}/5</span>
                          </div>
                        </div>
                      )}
                      
                      {sessionData.tutor_review.motivation_effort && (
                        <div>
                          <span className="text-muted-foreground">Motivation/Effort:</span>
                          <div className="flex items-center gap-1">
                            <StarRating rating={sessionData.tutor_review.motivation_effort} showValue={false} className="scale-75" />
                            <span className="font-medium">{sessionData.tutor_review.motivation_effort}/5</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Attendance */}
                    <div>
                      <span className="text-muted-foreground">Student Attendance:</span>
                      <Badge 
                        variant={sessionData.tutor_review.student_showed_up ? "default" : "destructive"}
                        className="ml-2"
                      >
                        {sessionData.tutor_review.student_showed_up ? "Present" : "Absent"}
                      </Badge>
                    </div>

                    {/* Tutor Feedback */}
                    {sessionData.tutor_review.tutor_feedback && (
                      <div>
                        <span className="text-muted-foreground font-medium">Tutor Feedback:</span>
                        <p className="mt-1 p-2 bg-gray-50 rounded text-sm italic">
                          "{sessionData.tutor_review.tutor_feedback}"
                        </p>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Submitted: {format(new Date(sessionData.tutor_review.created_at!), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm italic">No tutor review submitted for this session.</p>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
};