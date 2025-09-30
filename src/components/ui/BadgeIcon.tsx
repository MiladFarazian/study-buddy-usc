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
  sm: 'w-8 h-8 text-base',
  md: 'w-10 h-10 text-lg',
  lg: 'w-14 h-14 text-2xl'
};

// Rarity-specific visual designs
const rarityStyles = {
  common: {
    bg: 'bg-[#E0F2FE]',
    border: 'border border-[#E5E7EB]',
    icon: 'text-white',
    shadow: ''
  },
  uncommon: {
    bg: 'bg-gradient-to-br from-[#A855F7] to-[#7C3AED]',
    border: 'border-2 border-purple-400',
    icon: 'text-white',
    shadow: 'shadow-sm'
  },
  rare: {
    bg: 'bg-gradient-to-br from-[#94A3B8] to-[#64748B]',
    border: 'border-2 border-slate-400',
    icon: 'text-white drop-shadow-md',
    shadow: 'shadow-md'
  },
  epic: {
    bg: 'bg-gradient-to-br from-[#F59E0B] to-[#D97706]',
    border: 'border-[3px] border-amber-400',
    icon: 'text-white drop-shadow-lg',
    shadow: 'shadow-lg shadow-amber-500/30'
  },
  legendary: {
    bg: 'bg-[#990000]',
    border: 'border-[3px] border-[#FFD700]',
    icon: 'text-[#FFD700]',
    shadow: 'shadow-xl shadow-red-900/40'
  }
};

export const BadgeIcon: React.FC<BadgeIconProps> = ({ 
  badgeType, 
  size = 'sm', 
  showTooltip = true,
  className 
}) => {
  const config = getBadgeConfig(badgeType);
  
  if (!config) return null;

  const styles = rarityStyles[config.rarity as keyof typeof rarityStyles] || rarityStyles.common;

  const badgeContent = (
    <div
      className={cn(
        'rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 hover:scale-110',
        styles.bg,
        styles.border,
        styles.shadow,
        sizeClasses[size],
        className
      )}
      title={!showTooltip ? config.name : undefined}
    >
      <span className={styles.icon}>{config.icon}</span>
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
                config.rarity === 'legendary' && "bg-gradient-to-r from-red-600 to-red-800 text-yellow-300",
                config.rarity === 'epic' && "bg-gradient-to-r from-amber-500 to-amber-600 text-white",
                config.rarity === 'rare' && "bg-gradient-to-r from-slate-400 to-slate-500 text-white",
                config.rarity === 'uncommon' && "bg-gradient-to-r from-purple-500 to-purple-600 text-white",
                config.rarity === 'common' && "bg-sky-200 text-sky-900"
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
