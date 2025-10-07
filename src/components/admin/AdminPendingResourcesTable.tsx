import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, FileText, Loader2, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PendingResource {
  id: string;
  title: string;
  description: string | null;
  resource_type: string;
  file_name: string;
  file_size: number;
  uploaded_at: string;
  uploader: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
  courses: Array<{
    course_number: string;
    course_title: string | null;
  }>;
}

export function AdminPendingResourcesTable() {
  const [resources, setResources] = useState<PendingResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingResources();
  }, []);

  const fetchPendingResources = async () => {
    try {
      const { data: resources, error } = await supabase
        .from("resources")
        .select(`
          id,
          title,
          description,
          resource_type,
          file_name,
          file_size,
          uploaded_at,
          uploader:profiles!uploader_id (
            first_name,
            last_name,
            email
          ),
          resource_courses (
            course_number,
            course_title
          )
        `)
        .eq("status", "pending")
        .order("uploaded_at", { ascending: false });

      if (error) throw error;

      setResources(
        resources.map((r: any) => ({
          ...r,
          uploader: r.uploader,
          courses: r.resource_courses,
        }))
      );
    } catch (error: any) {
      console.error("Error fetching pending resources:", error);
      toast({
        title: "Error",
        description: "Failed to load pending resources",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (resourceId: string) => {
    setProcessing(resourceId);
    try {
      const { error } = await supabase.functions.invoke("admin-review-resource", {
        body: { resourceId, action: "approve" },
      });

      if (error) throw error;

      toast({
        title: "Resource approved",
        description: "The resource is now available to students",
      });

      fetchPendingResources();
    } catch (error: any) {
      console.error("Approval error:", error);
      toast({
        title: "Approval failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!selectedResource) return;

    setProcessing(selectedResource);
    try {
      const { error } = await supabase.functions.invoke("admin-review-resource", {
        body: {
          resourceId: selectedResource,
          action: "reject",
          rejectionReason,
        },
      });

      if (error) throw error;

      toast({
        title: "Resource rejected",
        description: "The uploader has been notified",
      });

      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedResource(null);
      fetchPendingResources();
    } catch (error: any) {
      console.error("Rejection error:", error);
      toast({
        title: "Rejection failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const openRejectDialog = (resourceId: string) => {
    setSelectedResource(resourceId);
    setRejectDialogOpen(true);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No pending resources</h3>
        <p className="text-muted-foreground">All resources have been reviewed!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {resources.map((resource) => {
          const uploaderName = `${resource.uploader.first_name || ""} ${resource.uploader.last_name || ""}`.trim() || "Anonymous";
          const isProcessing = processing === resource.id;

          return (
            <Card key={resource.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                    <CardDescription>
                      {resource.description || "No description provided"}
                    </CardDescription>
                  </div>
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Courses */}
                  <div className="flex flex-wrap gap-1">
                    {resource.courses.map((course) => (
                      <Badge key={course.course_number} variant="outline">
                        {course.course_number}
                      </Badge>
                    ))}
                  </div>

                  {/* Meta Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Uploaded by:</span>
                      <p className="font-medium">
                        {uploaderName}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {resource.uploader.email}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">File:</span>
                      <p className="font-medium">
                        {resource.file_name}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {formatBytes(resource.file_size)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <p className="font-medium capitalize">
                        {resource.resource_type.replace("_", " ")}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Uploaded:</span>
                      <p className="font-medium">
                        {formatDistanceToNow(new Date(resource.uploaded_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleApprove(resource.id)}
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => openRejectDialog(resource.id)}
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Resource</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this resource. The uploader will be
              notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setRejectionReason("");
                  setSelectedResource(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
