import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getBadgeConfig, BADGE_RARITIES } from '@/lib/badgeConfig';
import { cn } from '@/lib/utils';

interface BadgeIconProps {
  badgeType: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-12 h-12 text-lg'
};

const colorGradients = {
  purple: 'bg-gradient-to-br from-purple-400 to-purple-600',
  orange: 'bg-gradient-to-br from-orange-400 to-red-500',
  yellow: 'bg-gradient-to-br from-yellow-300 to-yellow-500',
  blue: 'bg-gradient-to-br from-blue-400 to-cyan-500',
  indigo: 'bg-gradient-to-br from-indigo-400 to-purple-600',
  green: 'bg-gradient-to-br from-green-400 to-emerald-500',
  cyan: 'bg-gradient-to-br from-cyan-400 to-blue-400',
  gray: 'bg-gradient-to-br from-gray-400 to-gray-600',
  violet: 'bg-gradient-to-br from-violet-400 to-purple-500',
  pink: 'bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-500'
};

const rarityEffects = {
  common: '',
  rare: 'shadow-md ring-1 ring-white/50',
  epic: 'shadow-lg ring-2 ring-white/60',
  legendary: 'shadow-xl ring-2 ring-yellow-300/80 animate-pulse'
};

export const BadgeIcon: React.FC<BadgeIconProps> = ({ 
  badgeType, 
  size = 'sm', 
  showTooltip = true,
  className 
}) => {
  const config = getBadgeConfig(badgeType);
  
  if (!config) return null;

  const gradient = colorGradients[config.color as keyof typeof colorGradients] || colorGradients.gray;
  const rarityEffect = rarityEffects[config.rarity as keyof typeof rarityEffects] || '';
  const rarityWeight = BADGE_RARITIES[config.rarity as keyof typeof BADGE_RARITIES]?.weight || 1;

  const badgeContent = (
    <div
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 hover:scale-110',
        gradient,
        rarityEffect,
        sizeClasses[size],
        className
      )}
      title={!showTooltip ? config.name : undefined}
    >
      <span className="drop-shadow-sm">{config.icon}</span>
    </div>
  );

  if (!showTooltip) {
    return badgeContent;
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs z-50"
          sideOffset={8}
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{config.name.split(':')[0]}</span>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                config.rarity === 'legendary' && "bg-gradient-to-r from-yellow-300 to-amber-400 text-amber-900",
                config.rarity === 'epic' && "bg-purple-200 text-purple-900",
                config.rarity === 'rare' && "bg-blue-200 text-blue-900",
                config.rarity === 'common' && "bg-gray-200 text-gray-700"
              )}>
                {config.rarity}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {config.description}
            </div>
            <div className="text-xs border-t pt-2 mt-2">
              <div className="font-medium mb-1">Requirements:</div>
              <div className="space-y-1 text-muted-foreground">
                {Object.entries(config.criteria).map(([key, value]) => (
                  <div key={key}>• {formatCriterion(key, value)}</div>
                ))}
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const formatCriterion = (key: string, value: any): string => {
  const formatMap: Record<string, string> = {
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
