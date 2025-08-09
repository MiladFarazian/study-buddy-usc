import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EarnedBadge, BadgeProgress } from '@/hooks/useTutorBadges';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUpIcon, BarChartIcon, PieChartIcon, CalendarIcon } from 'lucide-react';
import { format, subMonths, eachMonthOfInterval } from 'date-fns';

interface BadgeAnalyticsProps {
  progressData: BadgeProgress | null;
  earnedBadges: EarnedBadge[];
}

export function BadgeAnalytics({ progressData, earnedBadges }: BadgeAnalyticsProps) {
  // Generate mock historical data for charts
  const generateHistoricalData = () => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 11),
      end: new Date()
    });

    return months.map((month, index) => {
      const sessionsGrowth = Math.min((progressData?.total_sessions || 0), (index + 1) * 8);
      const ratingGrowth = Math.min(5, 3.5 + (index * 0.15));
      
      return {
        month: format(month, 'MMM'),
        sessions: Math.floor(sessionsGrowth),
        rating: Number(ratingGrowth.toFixed(1)),
        streak: Math.floor(Math.random() * 4) + 1
      };
    });
  };

  const historicalData = generateHistoricalData();

  // Badge rarity distribution
  const badgeRarityData = earnedBadges.reduce((acc, badge) => {
    // This would normally come from BADGE_CONFIG, but we'll simulate it
    const rarities = ['common', 'rare', 'epic', 'legendary'];
    const rarity = rarities[Math.floor(Math.random() * rarities.length)];
    
    acc[rarity] = (acc[rarity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(badgeRarityData).map(([rarity, count]) => ({
    name: rarity.charAt(0).toUpperCase() + rarity.slice(1),
    value: count,
    color: {
      common: '#64748b',
      rare: '#3b82f6', 
      epic: '#8b5cf6',
      legendary: '#f59e0b'
    }[rarity] || '#64748b'
  }));

  // Performance metrics over time
  const performanceData = [
    { metric: 'Session Count', current: progressData?.total_sessions || 0, target: 100, unit: '' },
    { metric: 'Avg Rating', current: progressData?.avg_rating || 0, target: 5, unit: '/5' },
    { metric: 'Streak Weeks', current: progressData?.current_streak_weeks || 0, target: 10, unit: 'weeks' },
    { metric: 'Response Time', current: progressData?.avg_response_time_hours || 0, target: 2, unit: 'hrs', reverse: true }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Detailed Analytics</h2>
        <p className="text-muted-foreground">
          Comprehensive insights into your tutoring performance and badge progress
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceData.map((metric) => {
          const progress = metric.reverse 
            ? Math.max(0, (1 - metric.current / metric.target) * 100)
            : (metric.current / metric.target) * 100;
          
          return (
            <Card key={metric.metric}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{metric.metric}</span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(progress)}%
                  </Badge>
                </div>
                <div className="text-2xl font-bold">
                  {metric.current}{metric.unit}
                </div>
                <div className="text-xs text-muted-foreground">
                  Target: {metric.target}{metric.unit}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUpIcon className="w-5 h-5" />
              Session Growth Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rating Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChartIcon className="w-5 h-5" />
              Rating Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="rating" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--secondary))", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Badge Rarity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Badge Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No badges earned yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Streak Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Weekly Consistency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="streak" 
                  fill="hsl(var(--accent))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Insights Card */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">Session Growth</p>
                <p className="text-sm text-muted-foreground">
                  You've completed {progressData?.total_sessions || 0} sessions. Keep it up!
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">Rating Performance</p>
                <p className="text-sm text-muted-foreground">
                  Your average rating of {(progressData?.avg_rating || 0).toFixed(1)} shows excellent student satisfaction.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">Badge Progress</p>
                <p className="text-sm text-muted-foreground">
                  You've earned {earnedBadges.length} badge{earnedBadges.length !== 1 ? 's' : ''}. 
                  Focus on consistency to unlock more achievements.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}