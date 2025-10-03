import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Sparkles, TrendingUp } from "lucide-react";
import { useStudentAnalytics } from "@/hooks/useStudentAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const StudentAnalytics = () => {
  const { data, loading, error } = useStudentAnalytics();

  if (loading) {
    return (
      <div className="py-6 max-w-6xl mx-auto">
        <Skeleton className="h-12 w-96 mb-4 mx-auto" />
        <Skeleton className="h-6 w-64 mb-12 mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
        <Skeleton className="h-96 rounded-2xl mb-12" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6 max-w-6xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-3">Your Wellness Journey</h1>
        <p className="text-destructive">We're having trouble loading your wellness data. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="py-6 max-w-6xl mx-auto">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Your Wellness Journey
        </h1>
        <p className="text-muted-foreground text-lg">
          Everyone's progress looks different - this is your unique path
        </p>
      </div>

      {/* Key Wellness Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <Card className="border-2 shadow-lg rounded-2xl bg-gradient-to-br from-card to-accent/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Wellness Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary mb-2">{data?.totalSessions || 0}</div>
            <p className="text-sm text-muted-foreground">Steps in your journey</p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg rounded-2xl bg-gradient-to-br from-card to-accent/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-secondary" />
              Growth Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-secondary mb-2">{data?.hoursStudied || 0}</div>
            <p className="text-sm text-muted-foreground">Time invested in yourself</p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg rounded-2xl bg-gradient-to-br from-card to-accent/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Feeling Better
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary mb-2">
              {data?.stressReduction !== null && data.stressReduction > 0 ? '+' : ''}
              {data?.stressReduction !== null ? `${Math.abs(data.stressReduction).toFixed(1)}` : '-'}
            </div>
            <p className="text-sm text-muted-foreground">
              {data?.stressReduction !== null && data.stressReduction > 0 
                ? "Your stress levels are gently improving" 
                : "Building your wellness foundation"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Wellness Journey Chart */}
      <div className="mb-12">
        <Card className="border-2 shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Your Stress Reduction Journey</CardTitle>
            <CardDescription className="text-base">
              Tracking how you feel before and after each session
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data?.wellnessData ? (
              <div className="space-y-8">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart 
                    data={[
                      { stage: 'Before Sessions', stress: data.wellnessData.stressBefore, label: 'Starting Point' },
                      { stage: 'After Sessions', stress: data.wellnessData.stressAfter, label: 'Current State' },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="stage" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      domain={[0, 10]} 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      label={{ value: 'Stress Level', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        padding: '12px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="stress" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', r: 6 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="bg-accent/50 p-6 rounded-xl">
                  <p className="text-center text-muted-foreground italic">
                    "{data.wellnessData.stressAfter < data.wellnessData.stressBefore 
                      ? "You're making meaningful progress in managing stress" 
                      : "Every step forward is valuable, even when progress feels gradual"}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-center space-y-4">
                <Heart className="h-16 w-16 text-muted-foreground/30" />
                <p className="text-muted-foreground text-lg">
                  Complete sessions and reviews to see your wellness journey unfold
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mental Wellness Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <Card className="border-2 shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl">Building Confidence</CardTitle>
            <CardDescription>You're growing at your own pace</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.wellnessData ? (
              <div className="space-y-6 py-4">
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-primary mb-2">
                    {data.wellnessData.confidenceImprovement.toFixed(1)}
                  </div>
                  <p className="text-muted-foreground">
                    {data.wellnessData.confidenceImprovement >= 7 
                      ? "Feeling more confident lately" 
                      : data.wellnessData.confidenceImprovement >= 5
                      ? "Steadily building confidence"
                      : "Taking the first steps to confidence"}
                  </p>
                </div>
                <div className="w-full bg-accent rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-primary to-secondary h-4 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${(data.wellnessData.confidenceImprovement / 10) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Start your journey to see progress
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl">Managing Anxiety</CardTitle>
            <CardDescription>Finding your calm, step by step</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.wellnessData ? (
              <div className="space-y-6 py-4">
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-secondary mb-2">
                    {data.wellnessData.anxietyReduction.toFixed(1)}
                  </div>
                  <p className="text-muted-foreground">
                    {data.wellnessData.anxietyReduction >= 7 
                      ? "Anxiety levels noticeably lower" 
                      : data.wellnessData.anxietyReduction >= 5
                      ? "Making progress with anxiety"
                      : "Learning to manage anxiety"}
                  </p>
                </div>
                <div className="w-full bg-accent rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-secondary to-primary h-4 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${(data.wellnessData.anxietyReduction / 10) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Start your journey to see progress
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Support Network */}
      <Card className="border-2 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl">Your Support Network</CardTitle>
          <CardDescription>Tutors who've been part of your journey</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.tutors && data.tutors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.tutors.map((tutor) => (
                <div key={tutor.id} className="flex items-center gap-4 p-4 bg-accent/50 rounded-xl hover:bg-accent transition-colors">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={tutor.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary">{tutor.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{tutor.name}</p>
                    <p className="text-sm text-muted-foreground">{tutor.sessions} sessions together</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center text-center space-y-4">
              <Heart className="h-16 w-16 text-muted-foreground/30" />
              <p className="text-muted-foreground">
                Your support network will appear here as you book sessions
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentAnalytics;
