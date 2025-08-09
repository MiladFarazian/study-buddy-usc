import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthProfile } from '@/hooks/useAuthProfile';
import { useTutorBadges } from '@/hooks/useTutorBadges';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { TrophyIcon, TrendingUpIcon, TargetIcon, ShareIcon } from 'lucide-react';
import { BadgeProgressOverview } from './components/BadgeProgressOverview';
import { AchievementTimeline } from './components/AchievementTimeline';
import { GoalRecommendations } from './components/GoalRecommendations';
import { BadgeAnalytics } from './components/BadgeAnalytics';
import { BadgeSharing } from './components/BadgeSharing';

export default function BadgesDashboard() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useAuthProfile(user?.id);
  const { earnedBadges, progressData, loading: badgesLoading } = useTutorBadges(profile?.id || '');

  if (profileLoading || badgesLoading) {
    return <LoadingScreen />;
  }

  if (profile?.role !== 'tutor') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-muted-foreground mb-4">Access Denied</h2>
            <p className="text-muted-foreground">This dashboard is only available to tutors.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const badgeCount = earnedBadges.length;
  const totalSessions = progressData?.total_sessions || 0;
  const avgRating = progressData?.avg_rating || 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Badge Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your achievements and unlock new badges
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <TrophyIcon className="w-4 h-4 mr-2" />
            {badgeCount} Badges Earned
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              Sessions completed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <TargetIcon className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Out of 5.0 stars
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/5 to-accent/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
            <TrophyIcon className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{badgeCount}</div>
            <p className="text-xs text-muted-foreground">
              Achievements unlocked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="sharing">Share</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <BadgeProgressOverview 
            earnedBadges={earnedBadges} 
            progressData={progressData} 
          />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <AchievementTimeline earnedBadges={earnedBadges} />
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <GoalRecommendations 
            earnedBadges={earnedBadges} 
            progressData={progressData} 
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <BadgeAnalytics 
            progressData={progressData} 
            earnedBadges={earnedBadges} 
          />
        </TabsContent>

        <TabsContent value="sharing" className="space-y-6">
          <BadgeSharing earnedBadges={earnedBadges} />
        </TabsContent>
      </Tabs>
    </div>
  );
}