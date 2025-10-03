import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, Star, BookOpen, Heart, TrendingUp } from "lucide-react";
import { useTutorAnalytics } from "@/hooks/useTutorAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const TutorAnalytics = () => {
  const { data, loading, error } = useTutorAnalytics();

  if (loading) {
    return (
      <div className="py-6 max-w-6xl mx-auto">
        <Skeleton className="h-12 w-96 mb-4" />
        <Skeleton className="h-6 w-64 mb-12" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-96 rounded-2xl mb-12" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6 max-w-6xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-3">Tutor Dashboard</h1>
        <p className="text-destructive">We're having trouble loading your analytics data. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="py-6 max-w-6xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Your Impact Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">Track your tutoring performance and student success</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card className="border-2 shadow-lg rounded-2xl bg-gradient-to-br from-card to-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">{data?.totalSessions || 0}</div>
            <p className="text-sm text-muted-foreground mt-1">All time sessions</p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg rounded-2xl bg-gradient-to-br from-card to-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Heart className="h-5 w-5 text-secondary" />
              Would Book Again
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-secondary">
              {data?.wouldBookAgain ? `${Math.round(data.wouldBookAgain.percentage)}%` : '-'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {data?.wouldBookAgain ? `${data.wouldBookAgain.count} students` : 'No reviews yet'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg rounded-2xl bg-gradient-to-br from-card to-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Average Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {data?.averageRating !== null ? data.averageRating.toFixed(1) : '-'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">From student reviews</p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg rounded-2xl bg-gradient-to-br from-card to-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-secondary" />
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-secondary">${data?.totalEarnings.toFixed(2) || '0.00'}</div>
            <p className="text-sm text-muted-foreground mt-1">All time earnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Student Impact Metrics */}
      <Card className="border-2 shadow-lg rounded-2xl mb-12">
        <CardHeader>
          <CardTitle className="text-2xl">Student Wellness Impact</CardTitle>
          <CardDescription className="text-base">How you're helping students succeed</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.impactMetrics ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-accent/50 rounded-xl">
                <Heart className="h-12 w-12 text-primary mx-auto mb-3" />
                <div className="text-4xl font-bold text-primary mb-2">
                  {data.impactMetrics.avgStressReduction.toFixed(1)}
                </div>
                <p className="text-sm text-muted-foreground">Avg. Stress Reduction</p>
              </div>
              <div className="text-center p-6 bg-accent/50 rounded-xl">
                <TrendingUp className="h-12 w-12 text-secondary mx-auto mb-3" />
                <div className="text-4xl font-bold text-secondary mb-2">
                  {data.impactMetrics.avgConfidenceImprovement.toFixed(1)}
                </div>
                <p className="text-sm text-muted-foreground">Avg. Confidence Boost</p>
              </div>
              <div className="text-center p-6 bg-accent/50 rounded-xl">
                <Users className="h-12 w-12 text-primary mx-auto mb-3" />
                <div className="text-4xl font-bold text-primary mb-2">
                  {data.impactMetrics.studentsHelped}
                </div>
                <p className="text-sm text-muted-foreground">Students Helped</p>
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Complete sessions to see your impact
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <Card className="border-2 shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl">Session Activity</CardTitle>
            <CardDescription>Sessions completed over time</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.sessionsByMonth && data.sessionsByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.sessionsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Session data will appear after completing sessions
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl">Earnings Overview</CardTitle>
            <CardDescription>Your revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.earningsByMonth && data.earningsByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.earningsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="earnings" fill="hsl(var(--secondary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Earnings data will appear after completing sessions
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Courses */}
      <Card className="border-2 shadow-lg rounded-2xl mb-12">
        <CardHeader>
          <CardTitle className="text-xl">Popular Courses</CardTitle>
          <CardDescription>Your most taught subjects</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.topCourses && data.topCourses.length > 0 ? (
            <div className="space-y-4">
              {data.topCourses.map((course, index) => (
                <div key={course.course} className="flex items-center justify-between p-4 bg-accent/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{course.course}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {course.count} {course.count === 1 ? 'session' : 'sessions'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Complete sessions to see your top courses
            </div>
          )}
        </CardContent>
      </Card>

      {/* Your Students */}
      <Card className="border-2 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl">Your Students</CardTitle>
          <CardDescription>Students you've tutored</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.students && data.students.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.students.map((student) => (
                <div key={student.id} className="flex items-center gap-4 p-4 bg-accent/50 rounded-xl hover:bg-accent transition-colors">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={student.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary">{student.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.sessions} sessions together</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center text-center space-y-4">
              <Users className="h-16 w-16 text-muted-foreground/30" />
              <p className="text-muted-foreground">
                Your students will appear here as you complete sessions
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TutorAnalytics;
