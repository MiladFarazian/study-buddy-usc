import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface NoShowSummaryStatsProps {
  totalReports: number;
  topTutors: Array<{
    id: string;
    name: string;
    count: number;
  }>;
  recentReports: number;
}

export const NoShowSummaryStats = ({ 
  totalReports, 
  topTutors, 
  recentReports 
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
              <span className="text-sm">Recent reports:</span>
              <Badge variant="secondary">{recentReports}</Badge>
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
            {topTutors.length > 0 ? (
              topTutors.slice(0, 3).map((tutor, index) => (
                <div key={tutor.id} className="flex justify-between items-center text-sm">
                  <span className="truncate">{tutor.name}</span>
                  <Badge variant="destructive" className="ml-2">
                    {tutor.count}
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