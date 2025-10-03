
import { useAuth } from "@/contexts/AuthContext";
import StudentAnalytics from "@/components/analytics/StudentAnalytics";
import TutorAnalytics from "@/components/analytics/TutorAnalytics";
import { Skeleton } from "@/components/ui/skeleton";

const Analytics = () => {
  const { isTutor, isStudent, loading } = useAuth();

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

  if (isTutor) {
    return <TutorAnalytics />;
  }

  if (isStudent) {
    return <StudentAnalytics />;
  }

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold mb-2">Analytics</h1>
      <p className="text-muted-foreground">Please complete your profile to access analytics.</p>
    </div>
  );
};

export default Analytics;
