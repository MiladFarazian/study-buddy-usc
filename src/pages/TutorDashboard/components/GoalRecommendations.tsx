import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BADGE_CONFIG } from '@/lib/badgeConfig';
import { EarnedBadge, BadgeProgress } from '@/hooks/useTutorBadges';
import { TargetIcon, ArrowRightIcon, StarIcon } from 'lucide-react';

interface GoalRecommendationsProps {
  earnedBadges: EarnedBadge[];
  progressData: BadgeProgress | null;
}

export function GoalRecommendations({ earnedBadges, progressData }: GoalRecommendationsProps) {
  const earnedBadgeTypes = earnedBadges.map(badge => badge.badge_type);

  const getRecommendations = () => {
    if (!progressData) return [];

    const recommendations = [];
    
    // Check each badge type for recommendations
    Object.entries(BADGE_CONFIG).forEach(([badgeType, config]) => {
      if (earnedBadgeTypes.includes(badgeType)) return;

      const criteria = (config as any).criteria;
      if (!criteria) return;

      let progress = 0;
      let recommendation = null;
      let timeframe = '';
      let actionItems = [];

      if (criteria.min_sessions) {
        const remaining = criteria.min_sessions - progressData.total_sessions;
        if (remaining > 0) {
          progress = (progressData.total_sessions / criteria.min_sessions) * 100;
          recommendation = `Complete ${remaining} more session${remaining !== 1 ? 's' : ''}`;
          timeframe = remaining <= 5 ? 'This week' : remaining <= 20 ? 'This month' : 'Long term';
          actionItems = [
            'Schedule more tutoring sessions',
            'Reach out to existing students',
            'Update your availability calendar'
          ];
        }
      } else if (criteria.min_avg_rating) {
        const ratingGap = criteria.min_avg_rating - progressData.avg_rating;
        if (ratingGap > 0) {
          progress = (progressData.avg_rating / criteria.min_avg_rating) * 100;
          recommendation = `Improve average rating by ${ratingGap.toFixed(1)} points`;
          timeframe = 'Ongoing';
          actionItems = [
            'Ask for feedback after sessions',
            'Focus on student engagement',
            'Prepare session materials in advance'
          ];
        }
      } else if (criteria.min_streak_weeks) {
        const streakNeeded = criteria.min_streak_weeks - progressData.current_streak_weeks;
        if (streakNeeded > 0) {
          progress = (progressData.current_streak_weeks / criteria.min_streak_weeks) * 100;
          recommendation = `Maintain streak for ${streakNeeded} more week${streakNeeded !== 1 ? 's' : ''}`;
          timeframe = streakNeeded === 1 ? 'This week' : 'This month';
          actionItems = [
            'Schedule sessions consistently',
            'Set weekly tutoring goals',
            'Block time in your calendar'
          ];
        }
      }

      if (recommendation) {
        recommendations.push({
          badgeType,
          config,
          progress: Math.round(progress),
          recommendation,
          timeframe,
          actionItems,
          priority: progress > 50 ? 'high' : progress > 20 ? 'medium' : 'low'
        });
      }
    });

    // Sort by progress (highest first) and priority
    return recommendations.sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      return b.progress - a.progress;
    }).slice(0, 6); // Show top 6 recommendations
  };

  const recommendations = getRecommendations();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-muted';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <StarIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            All Caught Up!
          </h3>
          <p className="text-muted-foreground">
            You've earned all available badges or are making great progress. Keep up the excellent work!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Goal Recommendations</h2>
        <p className="text-muted-foreground">
          Personalized suggestions to help you earn your next badges
        </p>
      </div>

      <div className="grid gap-6">
        {recommendations.map(({ badgeType, config, progress, recommendation, timeframe, actionItems, priority }) => (
          <Card key={badgeType} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{config.icon}</div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {config.name}
                      <Badge 
                        variant={getPriorityBadgeVariant(priority)}
                        className="capitalize"
                      >
                        {priority} Priority
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {config.description}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {timeframe}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress 
                  value={progress} 
                  className="h-2"
                  style={{
                    '--progress-background': getPriorityColor(priority)
                  } as React.CSSProperties}
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <TargetIcon className="w-4 h-4" />
                  Next Step
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {recommendation}
                </p>
                
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Action Items:
                  </h5>
                  <ul className="space-y-1">
                    {actionItems.map((item, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <ArrowRightIcon className="w-3 h-3 text-muted-foreground" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Button className="w-full" variant="outline">
                View Full Badge Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick tips card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StarIcon className="w-5 h-5 text-blue-600" />
            Pro Tips for Badge Success
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              Focus on one badge at a time to make meaningful progress
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              Consistency beats intensity - regular sessions help with streaks
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              Ask students for feedback to improve your ratings
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              Update your profile and availability regularly
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}