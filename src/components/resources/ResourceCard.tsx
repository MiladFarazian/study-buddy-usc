import { Download, FileText, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface ResourceCardProps {
  resource: {
    id: string;
    title: string;
    description: string | null;
    resource_type: string;
    download_count: number;
    uploaded_at: string;
    file_name: string;
    uploader?: {
      first_name: string | null;
      last_name: string | null;
    };
    courses?: Array<{
      course_number: string;
      course_title: string | null;
    }>;
  };
}

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  notes: "Notes",
  practice_exam: "Practice Exam",
  study_guide: "Study Guide",
  slides: "Slides",
  summary: "Summary",
  other: "Other",
};

export function ResourceCard({ resource }: ResourceCardProps) {
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { data, error } = await supabase.functions.invoke("download-resource", {
        body: { resourceId: resource.id },
      });

      if (error) throw error;

      // Open signed URL in new tab
      window.open(data.signedUrl, "_blank");

      toast({
        title: "Download started",
        description: `Downloading ${resource.file_name}`,
      });
    } catch (error: any) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: error.message || "Failed to download resource",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const uploaderName = resource.uploader
    ? `${resource.uploader.first_name || ""} ${resource.uploader.last_name || ""}`.trim() || "Anonymous"
    : "Anonymous";

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{resource.title}</CardTitle>
            <CardDescription className="mt-1">
              {resource.description || "No description provided"}
            </CardDescription>
          </div>
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Courses */}
          {resource.courses && resource.courses.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {resource.courses.map((course) => (
                <Badge key={course.course_number} variant="outline" className="text-xs">
                  {course.course_number}
                </Badge>
              ))}
            </div>
          )}

          {/* Type */}
          <Badge variant="secondary">
            {RESOURCE_TYPE_LABELS[resource.resource_type] || resource.resource_type}
          </Badge>

          {/* Meta Info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>By {uploaderName}</span>
            <span>{formatDistanceToNow(new Date(resource.uploaded_at), { addSuffix: true })}</span>
          </div>

          {/* Download */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">
              {resource.download_count} download{resource.download_count !== 1 ? "s" : ""}
            </span>
            <Button onClick={handleDownload} disabled={downloading} size="sm">
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
