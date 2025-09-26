import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, RefreshCw } from "lucide-react";
import { NoShowReportsTable } from "@/components/admin/NoShowReportsTable";
import { NoShowSummaryStats } from "@/components/admin/NoShowSummaryStats";
import { ReviewsTable } from "@/components/admin/ReviewsTable";
import { useNoShowReports } from "@/hooks/useNoShowReports";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminDashboard = () => {
  const { adminLogout } = useAdminAuth();
  const navigate = useNavigate();
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

  const handleLogout = () => {
    adminLogout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            <span className="text-usc-cardinal">Admin</span> Dashboard
          </h1>
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <NoShowSummaryStats
          totalReports={summaryStats.totalReports}
          topTutors={summaryStats.topTutors}
          recentReports={summaryStats.recentReports}
        />

        <Tabs defaultValue="no-shows" className="space-y-6">
          <TabsList>
            <TabsTrigger value="no-shows">No-Show Reports</TabsTrigger>
            <TabsTrigger value="reviews">Student Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="no-shows">
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

          <TabsContent value="reviews">
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
      </main>
    </div>
  );
};

export default AdminDashboard;