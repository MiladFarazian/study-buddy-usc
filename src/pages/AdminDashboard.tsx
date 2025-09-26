import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { NoShowReportsTable } from "@/components/admin/NoShowReportsTable";
import { NoShowSummaryStats } from "@/components/admin/NoShowSummaryStats";
import { ReviewsTable } from "@/components/admin/ReviewsTable";
import { useNoShowReports } from "@/hooks/useNoShowReports";

const AdminDashboard = () => {
  const {
    reports,
    summaryStats,
    loading,
    dateFilter,
    setDateFilter,
    showResolved,
    setShowResolved,
    refetch
  } = useNoShowReports();

  return (
    <AdminLayout>
      <NoShowSummaryStats
        totalReports={summaryStats.totalReports}
        topTutors={summaryStats.topTutors}
        recentReports={summaryStats.recentReports}
      />

      <Tabs defaultValue="no-show-reports" className="space-y-6">
        <TabsList>
          <TabsTrigger value="no-show-reports">No-Show Reports</TabsTrigger>
          <TabsTrigger value="student-reviews">Student Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="no-show-reports">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>No-Show Reports Management</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="show-resolved">Show Resolved</Label>
                    <Switch
                      id="show-resolved"
                      checked={showResolved}
                      onCheckedChange={setShowResolved}
                    />
                  </div>
                  <Select value={dateFilter} onValueChange={(value: '7days' | '30days' | 'all') => setDateFilter(value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7days">Last 7 days</SelectItem>
                      <SelectItem value="30days">Last 30 days</SelectItem>
                      <SelectItem value="all">All time</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refetch}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground">Loading no-show reports...</p>
                </div>
              ) : (
                <NoShowReportsTable reports={reports} onRefresh={refetch} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="student-reviews">
          <Card>
            <CardHeader>
              <CardTitle>Student Reviews Management</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewsTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminDashboard;