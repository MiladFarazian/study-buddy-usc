import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, TrendingUp, Heart, DollarSign } from "lucide-react";
import { useStudentAnalytics } from "@/hooks/useStudentAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const StudentAnalytics = () => {
  const { data, loading, error } = useStudentAnalytics();

  if (loading) {
    return (
      <div className="py-6">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6">
        <h1 className="text-3xl font-bold mb-2">My Learning Analytics</h1>
        <p className="text-destructive">Error loading analytics data</p>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Learning Analytics</h1>
        <p className="text-muted-foreground">Track your learning journey and progress</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.totalSessions || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Hours Studied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.hoursStudied || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Total hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Stress Reduction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data?.stressReduction !== null ? `${data.stressReduction.toFixed(1)}` : '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Average change</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${data?.totalSpent.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Learning Overview</CardTitle>
            <CardDescription>Your session activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.sessionsByMonth && data.sessionsByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.sessionsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sessions" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No session data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mental Wellness</CardTitle>
            <CardDescription>Track your stress and confidence levels</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.wellnessData ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-secondary/50 rounded-lg">
                  <span className="text-sm font-medium">Stress Before</span>
                  <span className="text-2xl font-bold">{data.wellnessData.stressBefore.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-secondary/50 rounded-lg">
                  <span className="text-sm font-medium">Stress After</span>
                  <span className="text-2xl font-bold">{data.wellnessData.stressAfter.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-secondary/50 rounded-lg">
                  <span className="text-sm font-medium">Confidence Improvement</span>
                  <span className="text-2xl font-bold">{data.wellnessData.confidenceImprovement.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-secondary/50 rounded-lg">
                  <span className="text-sm font-medium">Anxiety Reduction</span>
                  <span className="text-2xl font-bold">{data.wellnessData.anxietyReduction.toFixed(1)}</span>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Complete sessions and reviews to see wellness metrics
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Favorite Subjects</CardTitle>
            <CardDescription>Most studied courses</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.favoriteSubjects && data.favoriteSubjects.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.favoriteSubjects} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="course" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Book sessions to see your favorite subjects
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Tutors</CardTitle>
            <CardDescription>Tutors you've worked with</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.tutors && data.tutors.length > 0 ? (
              <div className="space-y-4 max-h-[300px] overflow-y-auto">
                {data.tutors.map((tutor) => (
                  <div key={tutor.id} className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg">
                    <Avatar>
                      <AvatarImage src={tutor.avatar_url || undefined} />
                      <AvatarFallback>{tutor.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{tutor.name}</p>
                      <p className="text-sm text-muted-foreground">{tutor.sessions} sessions</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No tutors yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentAnalytics;
