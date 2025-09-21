import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface NoShowSummaryStatsProps {
  totalReports: number;
  topProblematicTutors: Array<{
    id: string;
    name: string;
    reportCount: number;
  }>;
  recentActivity: {
    last7Days: number;
    last30Days: number;
  };
}

export const NoShowSummaryStats = ({ 
  totalReports, 
  topProblematicTutors, 
  recentActivity 
}: NoShowSummaryStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pending Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalReports}</div>
          <p className="text-xs text-muted-foreground">
            Require admin review
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-sm">Last 7 days:</span>
              <Badge variant="secondary">{recentActivity.last7Days}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Last 30 days:</span>
              <Badge variant="secondary">{recentActivity.last30Days}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Most Reported Tutors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topProblematicTutors.length > 0 ? (
              topProblematicTutors.slice(0, 3).map((tutor, index) => (
                <div key={tutor.id} className="flex justify-between items-center text-sm">
                  <span className="truncate">{tutor.name}</span>
                  <Badge variant="destructive" className="ml-2">
                    {tutor.reportCount}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No problematic tutors</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};