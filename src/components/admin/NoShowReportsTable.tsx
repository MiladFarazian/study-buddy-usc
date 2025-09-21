import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, UserMinus, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { format } from "date-fns";

interface NoShowReport {
  id: string;
  start_time: string;
  no_show_report: string;
  course_id: string;
  created_at: string;
  tutor: {
    id: string;
    first_name: string;
    last_name: string;
  };
  student: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface NoShowReportsTableProps {
  reports: NoShowReport[];
  onRefresh: () => void;
}

export const NoShowReportsTable = ({ reports, onRefresh }: NoShowReportsTableProps) => {
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleWarnTutor = async (report: NoShowReport) => {
    setActionLoading(report.id);
    try {
      const { error } = await supabaseAdmin.functions.invoke('send-notification-email', {
        body: {
          type: 'tutor_warning',
          recipientEmail: `${report.tutor.first_name}@studybuddyusc.com`, // Placeholder email
          tutorName: `${report.tutor.first_name} ${report.tutor.last_name}`,
          studentName: `${report.student.first_name} ${report.student.last_name}`,
          sessionDate: format(new Date(report.start_time), "PPpp"),
          reason: JSON.parse(report.no_show_report).reason
        }
      });

      if (error) throw error;

      toast({
        title: "Warning Sent",
        description: `Warning email sent to ${report.tutor.first_name} ${report.tutor.last_name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send warning email",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendTutor = async (report: NoShowReport) => {
    setActionLoading(report.id);
    try {
      // Update tutor profile to mark as suspended (we'll use approved_tutor = false as suspension)
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ approved_tutor: false })
        .eq('id', report.tutor.id);

      if (error) throw error;

      toast({
        title: "Tutor Suspended",
        description: `${report.tutor.first_name} ${report.tutor.last_name} has been suspended`,
      });

      onRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to suspend tutor",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDismissReport = async (report: NoShowReport) => {
    setActionLoading(report.id);
    try {
      // Clear the no_show_report field to mark as resolved
      const { error } = await supabaseAdmin
        .from('sessions')
        .update({ no_show_report: null })
        .eq('id', report.id);

      if (error) throw error;

      toast({
        title: "Report Dismissed",
        description: "No-show report has been marked as resolved",
      });

      onRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to dismiss report",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const parseNoShowReport = (reportJson: string) => {
    try {
      return JSON.parse(reportJson);
    } catch {
      return { reason: reportJson, additionalDetails: '' };
    }
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Session Date/Time</TableHead>
            <TableHead>Tutor</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>No-Show Reason</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Report Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => {
            const reportData = parseNoShowReport(report.no_show_report);
            return (
              <TableRow key={report.id}>
                <TableCell>
                  {format(new Date(report.start_time), "MMM dd, yyyy 'at' h:mm a")}
                </TableCell>
                <TableCell>
                  {report.tutor.first_name} {report.tutor.last_name}
                </TableCell>
                <TableCell>
                  {report.student.first_name} {report.student.last_name}
                </TableCell>
                <TableCell>
                  <div>
                    <Badge variant="destructive" className="mb-1">
                      {reportData.reason || 'No reason provided'}
                    </Badge>
                    {reportData.additionalDetails && (
                      <p className="text-sm text-muted-foreground">
                        {reportData.additionalDetails}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {report.course_id || 'No course specified'}
                </TableCell>
                <TableCell>
                  {format(new Date(report.created_at), "MMM dd, yyyy")}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleWarnTutor(report)}
                      disabled={actionLoading === report.id}
                      className="flex items-center gap-1"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      Warn
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleSuspendTutor(report)}
                      disabled={actionLoading === report.id}
                      className="flex items-center gap-1"
                    >
                      <UserMinus className="h-3 w-3" />
                      Suspend
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDismissReport(report)}
                      disabled={actionLoading === report.id}
                      className="flex items-center gap-1"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Dismiss
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {reports.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">No pending no-show reports</p>
          <p className="text-sm text-muted-foreground">All reports have been resolved</p>
        </div>
      )}
    </div>
  );
};