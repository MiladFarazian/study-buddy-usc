import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StudentReviewWithNames } from '@/hooks/useStudentReviews';

interface ReviewAnalyticsDashboardProps {
  reviews: StudentReviewWithNames[];
  loading: boolean;
}

export const ReviewAnalyticsDashboard = ({ reviews, loading }: ReviewAnalyticsDashboardProps) => {
  const calculateAverage = (data: StudentReviewWithNames[], field: keyof StudentReviewWithNames) => {
    const validValues = data
      .map(item => item[field])
      .filter(value => value !== null && value !== undefined && typeof value === 'number') as number[];
    
    if (validValues.length === 0) return { average: 0, count: 0 };
    
    return {
      average: Number((validValues.reduce((sum, val) => sum + val, 0) / validValues.length).toFixed(2)),
      count: validValues.length
    };
  };

  const calculateStressReduction = (data: StudentReviewWithNames[]) => {
    const validPairs = data
      .filter(item => item.stress_before !== null && item.stress_after !== null)
      .map(item => (item.stress_before! - item.stress_after!));
    
    if (validPairs.length === 0) return { average: 0, count: 0 };
    
    return {
      average: Number((validPairs.reduce((sum, val) => sum + val, 0) / validPairs.length).toFixed(2)),
      count: validPairs.length
    };
  };

  const calculatePercentage = (data: StudentReviewWithNames[], field: keyof StudentReviewWithNames) => {
    const validValues = data
      .map(item => item[field])
      .filter(value => value !== null && value !== undefined && typeof value === 'boolean') as boolean[];
    
    if (validValues.length === 0) return { percentage: 0, count: 0 };
    
    const trueCount = validValues.filter(val => val).length;
    return {
      percentage: Number(((trueCount / validValues.length) * 100).toFixed(1)),
      count: validValues.length
    };
  };

  const analytics = useMemo(() => {
    const defaultMetrics = {
      teachingQuality: { average: 0, count: 0 },
      subjectClarity: { average: 0, count: 0 },
      engagementLevel: { average: 0, count: 0 },
      stressReduction: { average: 0, count: 0 },
      confidenceImprovement: { average: 0, count: 0 },
      emotionalSupport: { average: 0, count: 0 },
      learningAnxietyReduction: { average: 0, count: 0 },
      overallWellbeingImpact: { average: 0, count: 0 },
      wouldBookAgain: { percentage: 0, count: 0 },
      studentAttendance: { percentage: 0, count: 0 }
    };

    const defaultTutorMetrics = {
      camePrepared: { average: 0, count: 0 },
      respectful: { average: 0, count: 0 },
      motivationEffort: { average: 0, count: 0 },
      tutorAttendance: { percentage: 0, count: 0 }
    };

    if (!reviews.length) {
      return {
        studentMetrics: defaultMetrics,
        tutorMetrics: defaultTutorMetrics,
        totalReviews: 0
      };
    }

    // Calculate student review averages
    const studentMetrics = {
      teachingQuality: calculateAverage(reviews, 'teaching_quality'),
      subjectClarity: calculateAverage(reviews, 'subject_clarity'),
      engagementLevel: calculateAverage(reviews, 'engagement_level'),
      stressReduction: calculateStressReduction(reviews),
      confidenceImprovement: calculateAverage(reviews, 'confidence_improvement'),
      emotionalSupport: calculateAverage(reviews, 'emotional_support'),
      learningAnxietyReduction: calculateAverage(reviews, 'learning_anxiety_reduction'),
      overallWellbeingImpact: calculateAverage(reviews, 'overall_wellbeing_impact'),
      wouldBookAgain: calculatePercentage(reviews, 'would_book_again'),
      studentAttendance: calculatePercentage(reviews, 'student_showed_up')
    };

    // Calculate tutor review averages
    const tutorMetrics = {
      camePrepared: calculateAverage(reviews, 'came_prepared'),
      respectful: calculateAverage(reviews, 'respectful'),
      motivationEffort: calculateAverage(reviews, 'motivation_effort'),
      tutorAttendance: calculatePercentage(reviews, 'tutor_showed_up')
    };

    return {
      studentMetrics,
      tutorMetrics,
      totalReviews: reviews.length
    };
  }, [reviews]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const { studentMetrics, tutorMetrics, totalReviews } = analytics;

  return (
    <div className="space-y-6 mb-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Review Analytics Overview</h3>
        <div className="text-sm text-muted-foreground">
          Total Reviews: {totalReviews}
        </div>
      </div>

      {/* Student Review Metrics */}
      <div>
        <h4 className="text-md font-medium text-foreground mb-3">Student Review Averages</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Teaching Quality"
            value={studentMetrics.teachingQuality.average}
            count={studentMetrics.teachingQuality.count}
            type="rating"
          />
          <MetricCard
            title="Subject Clarity"
            value={studentMetrics.subjectClarity.average}
            count={studentMetrics.subjectClarity.count}
            type="rating"
          />
          <MetricCard
            title="Engagement Level"
            value={studentMetrics.engagementLevel.average}
            count={studentMetrics.engagementLevel.count}
            type="rating"
          />
          <MetricCard
            title="Stress Reduction"
            value={studentMetrics.stressReduction.average}
            count={studentMetrics.stressReduction.count}
            type="improvement"
          />
          <MetricCard
            title="Confidence Improvement"
            value={studentMetrics.confidenceImprovement.average}
            count={studentMetrics.confidenceImprovement.count}
            type="rating"
          />
          <MetricCard
            title="Emotional Support"
            value={studentMetrics.emotionalSupport.average}
            count={studentMetrics.emotionalSupport.count}
            type="rating"
          />
          <MetricCard
            title="Anxiety Reduction"
            value={studentMetrics.learningAnxietyReduction.average}
            count={studentMetrics.learningAnxietyReduction.count}
            type="rating"
          />
          <MetricCard
            title="Wellbeing Impact"
            value={studentMetrics.overallWellbeingImpact.average}
            count={studentMetrics.overallWellbeingImpact.count}
            type="rating"
          />
          <MetricCard
            title="Would Book Again"
            value={studentMetrics.wouldBookAgain.percentage}
            count={studentMetrics.wouldBookAgain.count}
            type="percentage"
          />
          <MetricCard
            title="Student Attendance"
            value={studentMetrics.studentAttendance.percentage}
            count={studentMetrics.studentAttendance.count}
            type="percentage"
          />
        </div>
      </div>

      {/* Tutor Review Metrics */}
      <div>
        <h4 className="text-md font-medium text-foreground mb-3">Tutor Review Averages</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Student Came Prepared"
            value={tutorMetrics.camePrepared.average}
            count={tutorMetrics.camePrepared.count}
            type="rating"
          />
          <MetricCard
            title="Student Respectful"
            value={tutorMetrics.respectful.average}
            count={tutorMetrics.respectful.count}
            type="rating"
          />
          <MetricCard
            title="Student Motivation"
            value={tutorMetrics.motivationEffort.average}
            count={tutorMetrics.motivationEffort.count}
            type="rating"
          />
          <MetricCard
            title="Tutor Attendance"
            value={tutorMetrics.tutorAttendance.percentage}
            count={tutorMetrics.tutorAttendance.count}
            type="percentage"
          />
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: number;
  count: number;
  type: 'rating' | 'percentage' | 'improvement';
}

const MetricCard = ({ title, value, count, type }: MetricCardProps) => {
  const getValueColor = () => {
    if (type === 'percentage') {
      if (value >= 90) return 'text-green-600';
      if (value >= 70) return 'text-yellow-600';
      return 'text-red-600';
    }
    
    if (type === 'rating') {
      if (value >= 4.5) return 'text-green-600';
      if (value >= 3.5) return 'text-yellow-600';
      return 'text-red-600';
    }
    
    // improvement type (stress reduction)
    if (value >= 2) return 'text-green-600';
    if (value >= 1) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatValue = () => {
    if (type === 'percentage') return `${value}%`;
    if (type === 'improvement') return `${value > 0 ? '+' : ''}${value}`;
    return `${value}/5`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <span className={`text-2xl font-bold ${getValueColor()}`}>
            {formatValue()}
          </span>
          <span className="text-xs text-muted-foreground">
            ({count})
          </span>
        </div>
      </CardContent>
    </Card>
  );
};