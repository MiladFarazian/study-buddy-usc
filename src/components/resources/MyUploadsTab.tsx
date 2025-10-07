import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface MyUpload {
  id: string;
  title: string;
  description: string | null;
  status: string;
  resource_type: string;
  uploaded_at: string;
  rejection_reason: string | null;
  courses: Array<{
    course_number: string;
  }>;
}

const STATUS_CONFIG = {
  pending: {
    label: "Pending Review",
    icon: Clock,
    variant: "secondary" as const,
  },
  approved: {
    label: "Approved",
    icon: CheckCircle,
    variant: "default" as const,
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    variant: "destructive" as const,
  },
};

export function MyUploadsTab() {
  const [uploads, setUploads] = useState<MyUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMyUploads();
  }, []);

  const fetchMyUploads = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: resources, error } = await supabase
        .from("resources")
        .select(`
          id,
          title,
          description,
          status,
          resource_type,
          uploaded_at,
          rejection_reason,
          resource_courses (
            course_number
          )
        `)
        .eq("uploader_id", user.id)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;

      setUploads(
        resources.map((r: any) => ({
          ...r,
          courses: r.resource_courses,
        }))
      );
    } catch (error: any) {
      console.error("Error fetching uploads:", error);
      toast({
        title: "Error",
        description: "Failed to load your uploads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (uploads.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No uploads yet</h3>
        <p className="text-muted-foreground">
          Upload your first resource to share with other students!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {uploads.map((upload) => {
        const statusConfig = STATUS_CONFIG[upload.status as keyof typeof STATUS_CONFIG];
        const StatusIcon = statusConfig.icon;

        return (
          <Card key={upload.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{upload.title}</CardTitle>
                  <CardDescription>
                    {upload.description || "No description"}
                  </CardDescription>
                </div>
                <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {statusConfig.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Courses */}
                {upload.courses.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {upload.courses.map((course) => (
                      <Badge key={course.course_number} variant="outline" className="text-xs">
                        {course.course_number}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Upload time */}
                <p className="text-sm text-muted-foreground">
                  Uploaded {formatDistanceToNow(new Date(upload.uploaded_at), { addSuffix: true })}
                </p>

                {/* Rejection reason */}
                {upload.status === "rejected" && upload.rejection_reason && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mt-2">
                    <p className="text-sm font-medium text-destructive mb-1">Reason for rejection:</p>
                    <p className="text-sm text-destructive/90">{upload.rejection_reason}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
