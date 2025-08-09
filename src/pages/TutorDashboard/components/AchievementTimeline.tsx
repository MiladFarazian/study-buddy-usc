import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BADGE_CONFIG } from '@/lib/badgeConfig';
import { EarnedBadge } from '@/hooks/useTutorBadges';
import { CalendarIcon, TrophyIcon } from 'lucide-react';
import { format } from 'date-fns';

interface AchievementTimelineProps {
  earnedBadges: EarnedBadge[];
}

export function AchievementTimeline({ earnedBadges }: AchievementTimelineProps) {
  const sortedBadges = [...earnedBadges].sort((a, b) => 
    new Date(b.earned_date).getTime() - new Date(a.earned_date).getTime()
  );

  const getRarityColor = (badgeType: string) => {
    const config = BADGE_CONFIG[badgeType];
    if (!config) return 'bg-muted';

    switch (config.rarity) {
      case 'legendary':
        return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'epic':
        return 'bg-gradient-to-r from-purple-400 to-pink-500';
      case 'rare':
        return 'bg-gradient-to-r from-blue-400 to-indigo-500';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500';
    }
  };

  const getRarityTextColor = (badgeType: string) => {
    const config = BADGE_CONFIG[badgeType];
    if (!config) return 'text-muted-foreground';

    switch (config.rarity) {
      case 'legendary':
        return 'text-yellow-600';
      case 'epic':
        return 'text-purple-600';
      case 'rare':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  if (earnedBadges.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <TrophyIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            No Badges Earned Yet
          </h3>
          <p className="text-muted-foreground">
            Complete sessions and provide excellent tutoring to earn your first badge!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Achievement Timeline</h2>
        <p className="text-muted-foreground">
          Your badge earning journey in chronological order
        </p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border"></div>

        <div className="space-y-6">
          {sortedBadges.map((badge, index) => {
            const config = BADGE_CONFIG[badge.badge_type];
            if (!config) return null;

            return (
              <div key={badge.id} className="relative flex items-start gap-6">
                {/* Timeline dot */}
                <div className={`
                  relative z-10 flex items-center justify-center 
                  w-16 h-16 rounded-full 
                  ${getRarityColor(badge.badge_type)}
                  shadow-lg
                `}>
                  <div className="text-2xl">
                    {config.icon}
                  </div>
                </div>

                {/* Badge content */}
                <Card className="flex-1 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {config.name}
                        <Badge 
                          variant="outline" 
                          className={`${getRarityTextColor(badge.badge_type)} border-current`}
                        >
                          {config.rarity}
                        </Badge>
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon className="w-4 h-4" />
                        {format(new Date(badge.earned_date), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      {config.description}
                    </p>
                    
                    {badge.criteria_met && Object.keys(badge.criteria_met).length > 0 && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <h4 className="text-sm font-medium mb-2">Achievement Details:</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(badge.criteria_met).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-muted-foreground capitalize">
                                {key.replace(/_/g, ' ')}:
                              </span>
                              <span className="font-medium">
                                {typeof value === 'number' ? value.toFixed(1) : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary stats */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Total Achievements</h3>
              <p className="text-muted-foreground">
                You've earned {earnedBadges.length} badge{earnedBadges.length !== 1 ? 's' : ''} so far
              </p>
            </div>
            <div className="text-3xl font-bold text-primary">
              {earnedBadges.length}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}