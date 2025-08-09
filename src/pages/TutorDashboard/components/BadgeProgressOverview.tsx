import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BADGE_CONFIG } from '@/lib/badgeConfig';
import { EarnedBadge, BadgeProgress } from '@/hooks/useTutorBadges';
import { CheckCircleIcon, ClockIcon, LockIcon } from 'lucide-react';

interface BadgeProgressOverviewProps {
  earnedBadges: EarnedBadge[];
  progressData: BadgeProgress | null;
}

export function BadgeProgressOverview({ earnedBadges, progressData }: BadgeProgressOverviewProps) {
  const earnedBadgeTypes = earnedBadges.map(badge => badge.badge_type);
  
  const calculateProgress = (badgeType: string) => {
    if (earnedBadgeTypes.includes(badgeType)) {
      return { progress: 100, status: 'earned' as const };
    }

    if (!progressData) {
      return { progress: 0, status: 'locked' as const };
    }

    const config = BADGE_CONFIG[badgeType];
    if (!config?.criteria) {
      return { progress: 0, status: 'locked' as const };
    }

    const criteria = config.criteria;
    let progress = 0;

    if (criteria.min_sessions) {
      progress = Math.min(100, (progressData.total_sessions / criteria.min_sessions) * 100);
    } else if (criteria.min_avg_rating) {
      progress = Math.min(100, (progressData.avg_rating / criteria.min_avg_rating) * 100);
    } else if (criteria.min_streak_weeks) {
      progress = Math.min(100, (progressData.current_streak_weeks / criteria.min_streak_weeks) * 100);
    }

    return { 
      progress: Math.round(progress), 
      status: progress > 0 ? 'in_progress' as const : 'locked' as const 
    };
  };

  const getStatusIcon = (status: 'earned' | 'in_progress' | 'locked') => {
    switch (status) {
      case 'earned':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <ClockIcon className="w-4 h-4 text-yellow-500" />;
      case 'locked':
        return <LockIcon className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: 'earned' | 'in_progress' | 'locked') => {
    switch (status) {
      case 'earned':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-yellow-500';
      case 'locked':
        return 'bg-muted';
    }
  };

  const badgeCategories = [
    { name: 'Session Milestones', badges: ['over_50_sessions', 'over_100_sessions'] },
    { name: 'Performance', badges: ['top_rated', 'superstar'] },
    { name: 'Student Success', badges: ['student_success_champion'] },
    { name: 'Consistency', badges: ['weekly_tutoring_streak'] },
    { name: 'Responsiveness', badges: ['quick_responder'] },
    { name: 'Special', badges: ['founding_tutor'] }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Progress Overview</h2>
        <p className="text-muted-foreground">
          Track your progress across all badge categories
        </p>
      </div>

      <div className="grid gap-6">
        {badgeCategories.map(category => (
          <Card key={category.name}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {category.name}
                <Badge variant="outline">
                  {category.badges.filter(badgeType => earnedBadgeTypes.includes(badgeType)).length} / {category.badges.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {category.badges.map(badgeType => {
                const config = BADGE_CONFIG[badgeType];
                const { progress, status } = calculateProgress(badgeType);
                
                if (!config) return null;

                return (
                  <div key={badgeType} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        <span className="font-medium">{config.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {progress}%
                      </span>
                    </div>
                    <Progress 
                      value={progress} 
                      className="h-2"
                      style={{
                        '--progress-background': getStatusColor(status)
                      } as React.CSSProperties}
                    />
                    <p className="text-xs text-muted-foreground">
                      {config.description}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}