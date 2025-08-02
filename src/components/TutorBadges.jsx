import React from 'react';
import { 
  BADGE_CONFIG, 
  getBadgeConfig, 
  getBadgeStyles, 
  meetsBadgeCriteria, 
  sortBadges 
} from '@/lib/badgeConfig.js';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock, Star, Calendar, Clock, TrendingUp } from 'lucide-react';

const TutorBadges = ({ 
  tutorId, 
  earnedBadges = [], 
  progressData = {}, 
  showProgress = true 
}) => {
  // Get all badge types and organize them by status
  const allBadgeTypes = Object.keys(BADGE_CONFIG);
  const earnedBadgeTypes = earnedBadges.map(badge => badge.badge_type || badge.type);
  
  const badges = allBadgeTypes.map(badgeType => {
    const config = getBadgeConfig(badgeType);
    const isEarned = earnedBadgeTypes.includes(badgeType);
    const meetsRequirements = progressData ? meetsBadgeCriteria(progressData, {}, badgeType) : false;
    
    return {
      type: badgeType,
      config,
      isEarned,
      meetsRequirements,
      progress: calculateProgress(badgeType, progressData)
    };
  });

  // Sort badges by rarity and earned status
  const sortedBadges = badges.sort((a, b) => {
    if (a.isEarned !== b.isEarned) return b.isEarned - a.isEarned;
    return sortBadges([{ type: a.type }, { type: b.type }]);
  });

  return (
    <TooltipProvider>
      <div className="w-full">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {sortedBadges.map(({ type, config, isEarned, meetsRequirements, progress }) => (
            <BadgeCard
              key={type}
              badgeType={type}
              config={config}
              isEarned={isEarned}
              meetsRequirements={meetsRequirements}
              progress={progress}
              showProgress={showProgress}
            />
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};

const BadgeCard = ({ 
  badgeType, 
  config, 
  isEarned, 
  meetsRequirements, 
  progress, 
  showProgress 
}) => {
  const styles = getBadgeStyles(badgeType);
  const rarityStyles = getRarityStyles(config.rarity);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Card 
          className={`
            relative transition-all duration-300 cursor-pointer
            hover:scale-105 hover:shadow-lg
            ${isEarned ? 'shadow-md' : 'opacity-60'}
            ${rarityStyles.border}
            ${isEarned ? rarityStyles.glow : ''}
          `}
        >
          <CardContent className="p-4 text-center">
            {/* Badge Icon */}
            <div className={`
              text-4xl mb-2 transition-all duration-300
              ${isEarned ? '' : 'grayscale'}
            `}>
              {isEarned ? config.icon : <Lock className="w-8 h-8 mx-auto text-muted-foreground" />}
            </div>

            {/* Badge Name */}
            <div className={`
              text-sm font-semibold mb-1 line-clamp-2
              ${isEarned ? 'text-foreground' : 'text-muted-foreground'}
            `}>
              {config.name.split(':')[0]} {/* Show first part before colon */}
            </div>

            {/* Progress Indicator */}
            {showProgress && !isEarned && progress && (
              <div className="mt-2">
                <ProgressIndicator 
                  badgeType={badgeType}
                  progress={progress}
                  config={config}
                />
              </div>
            )}

            {/* Rarity Indicator */}
            <div className={`
              absolute -top-1 -right-1 px-2 py-0.5 text-xs rounded-full
              ${rarityStyles.tag}
            `}>
              {config.rarity}
            </div>

            {/* Earned Badge Glow Effect */}
            {isEarned && (
              <div className={`
                absolute inset-0 rounded-lg pointer-events-none
                ${rarityStyles.innerGlow}
              `} />
            )}
          </CardContent>
        </Card>
      </TooltipTrigger>
      
      <TooltipContent 
        side="top" 
        className="max-w-xs"
        sideOffset={5}
      >
        <div className="space-y-2">
          <div className="font-semibold">{config.name}</div>
          <div className="text-sm text-muted-foreground">{config.description}</div>
          <div className="text-xs">
            <div className="font-medium mb-1">Requirements:</div>
            <CriteriaDisplay criteria={config.criteria} />
          </div>
          {progress && !isEarned && (
            <div className="text-xs border-t pt-2">
              <DetailedProgress badgeType={badgeType} progress={progress} />
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

const ProgressIndicator = ({ badgeType, progress, config }) => {
  if (badgeType.includes('sessions')) {
    return (
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">
          {progress.current}/{progress.target} sessions
        </div>
        <Progress value={(progress.current / progress.target) * 100} className="h-1" />
      </div>
    );
  }

  if (badgeType === 'top_rated') {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-center text-xs text-muted-foreground">
          <Star className="w-3 h-3 mr-1" />
          {progress.current?.toFixed(1)}/{progress.target}
        </div>
        <Progress value={(progress.current / progress.target) * 100} className="h-1" />
      </div>
    );
  }

  if (badgeType === 'weekly_tutoring_streak') {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-center text-xs text-muted-foreground">
          <Calendar className="w-3 h-3 mr-1" />
          {progress.current} weeks
        </div>
        <Progress value={Math.min((progress.current / progress.target) * 100, 100)} className="h-1" />
      </div>
    );
  }

  if (badgeType === 'quick_responder') {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-center text-xs text-muted-foreground">
          <Clock className="w-3 h-3 mr-1" />
          {progress.current?.toFixed(1)}h avg
        </div>
        <Progress value={Math.max(0, (1 - (progress.current / progress.target)) * 100)} className="h-1" />
      </div>
    );
  }

  if (badgeType === 'student_success_champion') {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-center text-xs text-muted-foreground">
          <TrendingUp className="w-3 h-3 mr-1" />
          {progress.current?.toFixed(1)} improvement
        </div>
        <Progress value={(progress.current / progress.target) * 100} className="h-1" />
      </div>
    );
  }

  return null;
};

const DetailedProgress = ({ badgeType, progress }) => {
  if (badgeType.includes('sessions')) {
    return `Progress: ${progress.current} of ${progress.target} sessions completed`;
  }
  
  if (badgeType === 'top_rated') {
    return `Current rating: ${progress.current?.toFixed(1)} stars (need ${progress.target})`;
  }
  
  if (badgeType === 'weekly_tutoring_streak') {
    return `Current streak: ${progress.current} weeks (need ${progress.target})`;
  }
  
  if (badgeType === 'quick_responder') {
    return `Average response time: ${progress.current?.toFixed(1)} hours (need under ${progress.target})`;
  }
  
  if (badgeType === 'student_success_champion') {
    return `Student improvement score: ${progress.current?.toFixed(1)} (need ${progress.target})`;
  }

  return 'Working towards this badge...';
};

const CriteriaDisplay = ({ criteria }) => {
  return (
    <div className="space-y-1">
      {Object.entries(criteria).map(([key, value]) => (
        <div key={key} className="text-muted-foreground">
          {formatCriterion(key, value)}
        </div>
      ))}
    </div>
  );
};

const formatCriterion = (key, value) => {
  const formatMap = {
    min_sessions: `Complete ${value}+ sessions`,
    min_avg_rating: `Maintain ${value}+ star average`,
    min_streak_weeks: `${value}+ week consecutive streak`,
    max_avg_response_hours: `Respond within ${value} hours`,
    min_avg_stress_reduction: `${value}+ stress reduction score`,
    signup_before: `Signed up before ${value}`,
    has_industry_experience: value ? 'Have industry experience' : 'No industry experience required',
    verified: value ? 'Account verified' : 'Verification not required',
    min_degree_level: `${value} degree or higher`,
    top_percentile: `Top ${value}% performance`,
    min_bookings: `${value}+ bookings`
  };
  
  return formatMap[key] || `${key}: ${value}`;
};

const getRarityStyles = (rarity) => {
  const styles = {
    common: {
      border: 'border-2 border-muted',
      glow: 'shadow-sm',
      innerGlow: 'bg-gradient-to-br from-muted/20 to-transparent',
      tag: 'bg-muted text-muted-foreground'
    },
    rare: {
      border: 'border-2 border-blue-300 dark:border-blue-700',
      glow: 'shadow-blue-200 dark:shadow-blue-900/50 shadow-lg',
      innerGlow: 'bg-gradient-to-br from-blue-100/30 to-transparent dark:from-blue-900/30',
      tag: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    },
    epic: {
      border: 'border-2 border-purple-300 dark:border-purple-700',
      glow: 'shadow-purple-200 dark:shadow-purple-900/50 shadow-lg',
      innerGlow: 'bg-gradient-to-br from-purple-100/30 to-transparent dark:from-purple-900/30',
      tag: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    },
    legendary: {
      border: 'border-4 border-amber-300 dark:border-amber-600 animate-pulse',
      glow: 'shadow-amber-200 dark:shadow-amber-900/50 shadow-xl',
      innerGlow: 'bg-gradient-to-br from-amber-100/40 to-transparent dark:from-amber-900/40',
      tag: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 dark:from-amber-900 dark:to-yellow-900 dark:text-amber-200'
    }
  };
  
  return styles[rarity] || styles.common;
};

const calculateProgress = (badgeType, progressData) => {
  const config = getBadgeConfig(badgeType);
  if (!config || !progressData) return null;

  const { criteria } = config;
  
  if (criteria.min_sessions) {
    return {
      current: progressData.total_sessions || 0,
      target: criteria.min_sessions
    };
  }
  
  if (criteria.min_avg_rating) {
    return {
      current: progressData.avg_rating || 0,
      target: criteria.min_avg_rating
    };
  }
  
  if (criteria.min_streak_weeks) {
    return {
      current: progressData.current_streak_weeks || 0,
      target: criteria.min_streak_weeks
    };
  }
  
  if (criteria.max_avg_response_hours) {
    return {
      current: progressData.avg_response_time_hours || 0,
      target: criteria.max_avg_response_hours
    };
  }
  
  if (criteria.min_avg_stress_reduction) {
    const avgStressReduction = progressData.total_stress_reduction && progressData.total_sessions 
      ? progressData.total_stress_reduction / progressData.total_sessions 
      : 0;
    return {
      current: avgStressReduction,
      target: criteria.min_avg_stress_reduction
    };
  }
  
  return null;
};

export { TutorBadges };
export default TutorBadges;