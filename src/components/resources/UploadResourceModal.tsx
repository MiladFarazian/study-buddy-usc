import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCourses } from "@/hooks/useCourses";

interface UploadResourceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const RESOURCE_TYPES = [
  { value: "notes", label: "Notes" },
  { value: "practice_exam", label: "Practice Exam" },
  { value: "study_guide", label: "Study Guide" },
  { value: "slides", label: "Slides" },
  { value: "summary", label: "Summary" },
  { value: "other", label: "Other" },
];

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "image/jpeg",
  "image/png",
];

const MAX_FILE_SIZE = 52428800; // 50MB

export function UploadResourceModal({ open, onOpenChange, onSuccess }: UploadResourceModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [courseSearch, setCourseSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { courses } = useCourses({ term: "20251", search: "", department: "all" });

  const filteredCourses = courses.filter(
    (course) =>
      course.course_number.toLowerCase().includes(courseSearch.toLowerCase()) ||
      course.course_title?.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "File size must be under 50MB",
        variant: "destructive",
      });
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF, DOC, PPT, XLS, TXT, JPG, or PNG files",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileChange({ target: { files: [droppedFile] } } as any);
    }
  };

  const toggleCourse = (courseNumber: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseNumber) ? prev.filter((c) => c !== courseNumber) : [...prev, courseNumber]
    );
  };

  const handleSubmit = async () => {
    if (!file || !title || !resourceType || selectedCourses.length === 0) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("description", description || "");
      formData.append("resourceType", resourceType);
      formData.append("courseNumbers", JSON.stringify(selectedCourses));

      const { error } = await supabase.functions.invoke("upload-resource", {
        body: formData,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your resource has been submitted for review",
      });

      // Reset form
      setFile(null);
      setTitle("");
      setDescription("");
      setResourceType("");
      setSelectedCourses([]);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload resource",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Resource</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <Label>File *</Label>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              {file ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drop file here or click to upload
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOC, PPT, XLS, TXT, JPG, PNG (Max 50MB)
                  </p>
                </>
              )}
            </div>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
            />
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., CSCI 201 Final Exam Study Guide"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of what this resource contains..."
              rows={3}
            />
          </div>

          {/* Resource Type */}
          <div>
            <Label>Resource Type *</Label>
            <Select value={resourceType} onValueChange={setResourceType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {RESOURCE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Course Selection */}
          <div>
            <Label>Courses * (Select at least one)</Label>
            <Input
              placeholder="Search courses..."
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              className="mb-2"
            />
            <div className="border rounded-lg max-h-48 overflow-y-auto">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="p-2 hover:bg-muted cursor-pointer flex items-center gap-2"
                  onClick={() => toggleCourse(course.course_number)}
                >
                  <input
                    type="checkbox"
                    checked={selectedCourses.includes(course.course_number)}
                    onChange={() => {}}
                    className="cursor-pointer"
                  />
                  <span className="text-sm">
                    {course.course_number} - {course.course_title}
                  </span>
                </div>
              ))}
            </div>
            {selectedCourses.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedCourses.map((course) => (
                  <span
                    key={course}
                    className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full flex items-center gap-1"
                  >
                    {course}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => toggleCourse(course)}
                    />
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={uploading}>
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload Resource
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
