
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer } from "@/components/ui/chart";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

const Analytics = () => {
  const { data, loading, error } = useAnalytics();
  
  // Growth indicator component
  const GrowthIndicator = ({ value }: { value: number }) => {
    if (value === 0) return null;
    
    return value > 0 ? (
      <p className="text-sm text-green-600 flex items-center mt-1">
        <ArrowUpIcon className="w-4 h-4 mr-1" />
        +{value}% from last month
      </p>
    ) : (
      <p className="text-sm text-red-600 flex items-center mt-1">
        <ArrowDownIcon className="w-4 h-4 mr-1" />
        {value}% from last month
      </p>
    );
  };

  // Analytics card with loading state
  const AnalyticsCard = ({ 
    title, 
    value, 
    growthPercentage,
    isLoading 
  }: { 
    title: string, 
    value: string | number, 
    growthPercentage?: number,
    isLoading: boolean 
  }) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-4 w-32" />
          </>
        ) : (
          <>
            <div className="text-3xl font-bold">{value}</div>
            {growthPercentage !== undefined && (
              <GrowthIndicator value={growthPercentage} />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics</h1>
          <p className="text-muted-foreground">Track platform usage and identify popular courses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <AnalyticsCard 
          title="Total Sessions" 
          value={data?.totalSessions || 0} 
          growthPercentage={data?.growthPercentage.sessions}
          isLoading={loading} 
        />
        <AnalyticsCard 
          title="Active Tutors" 
          value={data?.activeTutors || 0} 
          growthPercentage={data?.growthPercentage.tutors}
          isLoading={loading} 
        />
        <AnalyticsCard 
          title="Active Students" 
          value={data?.activeStudents || 0} 
          growthPercentage={data?.growthPercentage.students}
          isLoading={loading} 
        />
        <AnalyticsCard 
          title="Avg. Session Rating" 
          value={data?.averageRating || 0}
          growthPercentage={data?.growthPercentage.rating}
          isLoading={loading} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Session Growth</CardTitle>
            <CardDescription>Total tutoring sessions over time</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="w-full h-[300px] flex items-center justify-center bg-gray-50 rounded-md">
                <Skeleton className="h-[250px] w-[90%]" />
              </div>
            ) : error ? (
              <div className="w-full h-[300px] flex items-center justify-center bg-gray-50 rounded-md">
                <p className="text-red-500">Error loading data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data?.sessionGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="Sessions" stroke="#990000" fill="#990000" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Popular Courses</CardTitle>
            <CardDescription>Most frequently tutored subjects</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="w-full h-[300px] flex items-center justify-center bg-gray-50 rounded-md">
                <Skeleton className="h-[250px] w-[90%]" />
              </div>
            ) : error ? (
              <div className="w-full h-[300px] flex items-center justify-center bg-gray-50 rounded-md">
                <p className="text-red-500">Error loading data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.popularCourses || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Sessions" fill="#FFCC00" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
