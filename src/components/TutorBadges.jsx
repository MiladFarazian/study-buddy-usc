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
import { useIsMobile } from '@/hooks/use-mobile';

const TutorBadges = ({ 
  tutorId, 
  earnedBadges = [], 
  progressData = {}, 
  showProgress = true,
  showOnlyEarned = false
}) => {
  const isMobile = useIsMobile();
  
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

  // Filter badges based on showOnlyEarned prop
  const filteredBadges = showOnlyEarned 
    ? badges.filter(badge => badge.isEarned)
    : badges;

  // Sort badges by rarity and earned status
  const sortedBadges = filteredBadges.sort((a, b) => {
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
              isMobile={isMobile}
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
  showProgress,
  isMobile 
}) => {
  const styles = getBadgeStyles(badgeType);
  const rarityBadgeStyles = getRarityBadgeStyles(config.rarity);

  const hasProgress = progress && typeof progress.current === 'number' && typeof progress.target === 'number' && progress.target > 0 && progress.current > 0;
 
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Card 
          className={`
            relative cursor-default bg-white dark:bg-gray-900
            ${isEarned ? 'shadow-md' : 'opacity-60'}
          `}
        >
          <CardContent className="p-6 text-center">
            {/* Status and Rarity Labels - Hidden on mobile */}
            {!isMobile && (
              <div className="absolute top-3 left-3 flex items-center gap-2">
                {isEarned && (
                  <span className="text-xs font-medium px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
                    Earned
                  </span>
                )}
                <span className={`text-xs font-medium px-2 py-1 rounded ${rarityBadgeStyles}`}>
                  {config.rarity}
                </span>
              </div>
            )}

            {/* Badge Icon - Circular */}
            <div className={`
              w-20 h-20 mx-auto mb-4 mt-6 rounded-full flex items-center justify-center text-3xl
              ${isEarned ? '' : 'grayscale opacity-50'}
              ${getRarityCircleStyles(config.rarity)}
            `}>
              {isEarned ? config.icon : <Lock className="w-8 h-8 text-muted-foreground" />}
            </div>

            {/* Badge Name */}
            <div className={`
              text-sm font-semibold mb-2 line-clamp-2 min-h-[2.5rem]
              ${isEarned ? 'text-foreground' : 'text-muted-foreground'}
            `}>
              {config.name.split(':')[0]}
            </div>

            {/* Progress Indicator */}
            {showProgress && !isEarned && progress && (
              <div className="mt-3">
                <ProgressIndicator 
                  badgeType={badgeType}
                  progress={progress}
                  config={config}
                />
              </div>
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
        <Progress value={Math.max(0, Math.min(100, (progress?.target ? (progress.current / progress.target) * 100 : 0)))} className="h-1" />
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
        <Progress value={Math.max(0, Math.min(100, (progress?.target ? (progress.current / progress.target) * 100 : 0)))} className="h-1" />
      </div>
    );
  }

  if (badgeType === 'weekly_streak') {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-center text-xs text-muted-foreground">
          <Calendar className="w-3 h-3 mr-1" />
          {progress.current} weeks
        </div>
        <Progress value={Math.max(0, Math.min(100, (progress?.target ? (progress.current / progress.target) * 100 : 0)))} className="h-1" />
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
        <Progress value={Math.max(0, Math.min(100, (progress?.target ? (1 - (progress.current / progress.target)) * 100 : 0)))} className="h-1" />
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
        <Progress value={Math.max(0, Math.min(100, (progress?.target ? (progress.current / progress.target) * 100 : 0)))} className="h-1" />
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
  
  if (badgeType === 'weekly_streak') {
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

const getRarityBadgeStyles = (rarity) => {
  const styles = {
    common: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    uncommon: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    rare: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    epic: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    legendary: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
  };
  
  return styles[rarity] || styles.common;
};

const getRarityCircleStyles = (rarity) => {
  const styles = {
    common: 'bg-gradient-to-br from-[#E0F2FE] to-[#BAE6FD] border-2 border-[#E5E7EB]',
    uncommon: 'bg-gradient-to-br from-[#A855F7] to-[#7C3AED] border-2 border-purple-400 shadow-md',
    rare: 'bg-gradient-to-br from-[#94A3B8] to-[#64748B] border-2 border-slate-400 shadow-md',
    epic: 'bg-gradient-to-br from-[#F59E0B] to-[#D97706] border-[3px] border-amber-400 shadow-lg',
    legendary: 'bg-[#990000] border-[3px] border-[#FFD700] shadow-xl'
  };
  
  return styles[rarity] || styles.common;
};

const getRarityStyles = (rarity) => {
  const styles = {
    common: {
      border: 'border-2 border-muted',
      bg: 'bg-muted/40',
      tag: 'bg-muted text-muted-foreground'
    },
    uncommon: {
      border: 'border-2 border-purple-300 dark:border-purple-700',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      tag: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    },
    rare: {
      border: 'border-2 border-slate-300 dark:border-slate-700',
      bg: 'bg-slate-50 dark:bg-slate-950/30',
      tag: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200'
    },
    epic: {
      border: 'border-2 border-amber-300 dark:border-amber-700',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      tag: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
    },
    legendary: {
      border: 'border-4 border-red-300 dark:border-red-600',
      bg: 'bg-red-50 dark:bg-red-950/30',
      tag: 'bg-gradient-to-r from-red-100 to-yellow-100 text-red-800 dark:from-red-900 dark:to-yellow-900 dark:text-red-200'
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