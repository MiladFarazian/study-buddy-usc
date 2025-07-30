/**
 * Comprehensive Badge Configuration System
 * Defines all badge types, their criteria, and display properties
 */

export const BADGE_CONFIG = {
  founding_tutor: {
    name: "Founding Tutor",
    description: "One of our pioneering tutors who helped build the platform",
    icon: "🌟",
    criteria: {
      signup_before: "2025-10-01",
      min_sessions: 1
    },
    color: "purple",
    rarity: "legendary"
  },

  weekly_tutoring_streak: {
    name: "Weekly tutoring streak (2 week streak)",
    description: "Completed sessions for 2+ consecutive weeks",
    icon: "🔥",
    criteria: {
      min_streak_weeks: 2
    },
    color: "orange",
    rarity: "common"
  },

  top_rated: {
    name: "Top Rated",
    description: "Maintains 4.5+ star average with 10+ sessions",
    icon: "⭐",
    criteria: {
      min_avg_rating: 4.5,
      min_sessions: 10
    },
    color: "yellow",
    rarity: "rare"
  },

  over_50_sessions: {
    name: "Over 50 Sessions",
    description: "Completed 50+ tutoring sessions",
    icon: "💪",
    criteria: {
      min_sessions: 50
    },
    color: "blue",
    rarity: "rare"
  },

  over_100_sessions: {
    name: "Over 100 Sessions",
    description: "Completed 100+ tutoring sessions",
    icon: "🏆",
    criteria: {
      min_sessions: 100
    },
    color: "indigo",
    rarity: "epic"
  },

  student_success_champion: {
    name: "Student Success Champion: For tutors whose students show measurable improvement",
    description: "Consistently helps students reduce stress and improve confidence",
    icon: "🎯",
    criteria: {
      min_avg_stress_reduction: 2.0,
      min_sessions: 15
    },
    color: "green",
    rarity: "rare"
  },

  quick_responder: {
    name: "Quick Responder: For consistently responding to messages within 2 hours",
    description: "Responds to booking requests within 2 hours consistently",
    icon: "⚡",
    criteria: {
      max_avg_response_hours: 2.0,
      min_bookings: 20
    },
    color: "cyan",
    rarity: "common"
  },

  industry_professional: {
    name: "Industry Professional: For tutors with relevant industry experience",
    description: "Verified professional with relevant industry experience",
    icon: "💼",
    criteria: {
      has_industry_experience: true,
      verified: true
    },
    color: "gray",
    rarity: "rare"
  },

  advanced_degree: {
    name: "Advanced Degree: For tutors with Masters or PhD credentials",
    description: "Holds Masters or PhD credentials",
    icon: "🎓",
    criteria: {
      min_degree_level: "masters",
      verified: true
    },
    color: "violet",
    rarity: "rare"
  },

  superstar: {
    name: "Superstar: For tutors in the top 5% of ratings",
    description: "Top 5% of tutors by overall performance",
    icon: "✨",
    criteria: {
      top_percentile: 5,
      min_sessions: 25
    },
    color: "pink",
    rarity: "legendary"
  }
};

/**
 * Badge rarity levels with associated styling
 */
export const BADGE_RARITIES = {
  common: {
    label: "Common",
    weight: 1,
    borderStyle: "border-2"
  },
  rare: {
    label: "Rare", 
    weight: 2,
    borderStyle: "border-2 border-dashed"
  },
  epic: {
    label: "Epic",
    weight: 3,
    borderStyle: "border-4 border-double"
  },
  legendary: {
    label: "Legendary",
    weight: 4,
    borderStyle: "border-4 border-double animate-pulse"
  }
};

/**
 * Color theme mappings for badges
 */
export const BADGE_COLORS = {
  purple: {
    bg: "bg-purple-100",
    text: "text-purple-800",
    border: "border-purple-300",
    hover: "hover:bg-purple-200"
  },
  orange: {
    bg: "bg-orange-100", 
    text: "text-orange-800",
    border: "border-orange-300",
    hover: "hover:bg-orange-200"
  },
  yellow: {
    bg: "bg-yellow-100",
    text: "text-yellow-800", 
    border: "border-yellow-300",
    hover: "hover:bg-yellow-200"
  },
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-300", 
    hover: "hover:bg-blue-200"
  },
  indigo: {
    bg: "bg-indigo-100",
    text: "text-indigo-800",
    border: "border-indigo-300",
    hover: "hover:bg-indigo-200"
  },
  green: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-300",
    hover: "hover:bg-green-200"
  },
  cyan: {
    bg: "bg-cyan-100",
    text: "text-cyan-800", 
    border: "border-cyan-300",
    hover: "hover:bg-cyan-200"
  },
  gray: {
    bg: "bg-gray-100",
    text: "text-gray-800",
    border: "border-gray-300",
    hover: "hover:bg-gray-200"
  },
  violet: {
    bg: "bg-violet-100",
    text: "text-violet-800",
    border: "border-violet-300", 
    hover: "hover:bg-violet-200"
  },
  pink: {
    bg: "bg-pink-100",
    text: "text-pink-800",
    border: "border-pink-300",
    hover: "hover:bg-pink-200"
  }
};

/**
 * Helper Functions
 */

/**
 * Get badge configuration by type
 * @param {string} badgeType - The badge type identifier
 * @returns {Object|null} Badge configuration object or null if not found
 */
export const getBadgeConfig = (badgeType) => {
  return BADGE_CONFIG[badgeType] || null;
};

/**
 * Get all badge configurations
 * @returns {Object} All badge configurations
 */
export const getAllBadgeConfigs = () => {
  return BADGE_CONFIG;
};

/**
 * Get badges by rarity level
 * @param {string} rarity - The rarity level to filter by
 * @returns {Array} Array of badge configurations matching the rarity
 */
export const getBadgesByRarity = (rarity) => {
  return Object.entries(BADGE_CONFIG)
    .filter(([_, config]) => config.rarity === rarity)
    .map(([type, config]) => ({ type, ...config }));
};

/**
 * Get badge styling classes
 * @param {string} badgeType - The badge type identifier
 * @returns {Object} Combined styling classes for the badge
 */
export const getBadgeStyles = (badgeType) => {
  const config = getBadgeConfig(badgeType);
  if (!config) return {};

  const colorStyles = BADGE_COLORS[config.color] || BADGE_COLORS.gray;
  const rarityStyles = BADGE_RARITIES[config.rarity] || BADGE_RARITIES.common;

  return {
    ...colorStyles,
    ...rarityStyles,
    rarity: config.rarity,
    color: config.color
  };
};

/**
 * Check if a tutor meets the criteria for a specific badge
 * @param {Object} progress - Tutor's badge progress data
 * @param {Object} profile - Tutor's profile data
 * @param {string} badgeType - The badge type to check
 * @returns {boolean} Whether the tutor meets the criteria
 */
export const meetsBadgeCriteria = (progress, profile, badgeType) => {
  const config = getBadgeConfig(badgeType);
  if (!config) return false;

  const { criteria } = config;

  // Check each criterion
  for (const [key, value] of Object.entries(criteria)) {
    switch (key) {
      case 'signup_before':
        if (!profile.created_at || new Date(profile.created_at) >= new Date(value)) {
          return false;
        }
        break;
      case 'min_sessions':
        if ((progress.total_sessions || 0) < value) {
          return false;
        }
        break;
      case 'min_streak_weeks':
        if ((progress.current_streak_weeks || 0) < value) {
          return false;
        }
        break;
      case 'min_avg_rating':
        if ((progress.avg_rating || 0) < value) {
          return false;
        }
        break;
      case 'min_avg_stress_reduction':
        if ((progress.total_stress_reduction || 0) / Math.max(progress.total_sessions || 1, 1) < value) {
          return false;
        }
        break;
      case 'max_avg_response_hours':
        if ((progress.avg_response_time_hours || Infinity) > value) {
          return false;
        }
        break;
      case 'min_bookings':
        // This would need to be tracked separately or use total_sessions as proxy
        if ((progress.total_sessions || 0) < value) {
          return false;
        }
        break;
      case 'has_industry_experience':
        if (!profile.industry_experience && value) {
          return false;
        }
        break;
      case 'verified':
        if (!profile.verified && value) {
          return false;
        }
        break;
      case 'min_degree_level':
        // This would need to be stored in profile
        if (profile.degree_level !== 'masters' && profile.degree_level !== 'phd' && value === 'masters') {
          return false;
        }
        break;
      case 'top_percentile':
        // This would need to be calculated dynamically based on all tutors
        // For now, return false as this requires more complex logic
        return false;
      default:
        break;
    }
  }

  return true;
};

/**
 * Sort badges by rarity and type
 * @param {Array} badges - Array of badge objects with type property
 * @returns {Array} Sorted array of badges
 */
export const sortBadges = (badges) => {
  return badges.sort((a, b) => {
    const configA = getBadgeConfig(a.type || a.badge_type);
    const configB = getBadgeConfig(b.type || b.badge_type);
    
    if (!configA || !configB) return 0;
    
    const rarityA = BADGE_RARITIES[configA.rarity]?.weight || 0;
    const rarityB = BADGE_RARITIES[configB.rarity]?.weight || 0;
    
    // Sort by rarity first (legendary first), then alphabetically
    if (rarityA !== rarityB) {
      return rarityB - rarityA;
    }
    
    return configA.name.localeCompare(configB.name);
  });
};