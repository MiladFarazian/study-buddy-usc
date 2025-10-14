import { useState, useEffect } from "react";
import { ReferralGuard } from "@/components/auth/ReferralGuard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { ArrowLeft, Upload, Loader2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UploadResourceModal } from "@/components/resources/UploadResourceModal";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { ResourceFilters } from "@/components/resources/ResourceFilters";
import { MyUploadsTab } from "@/components/resources/MyUploadsTab";

interface Resource {
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
}

const ResourcesPage = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const { data: resourcesData, error } = await supabase
        .from("resources")
        .select(`
          id,
          title,
          description,
          resource_type,
          download_count,
          uploaded_at,
          file_name,
          uploader:profiles!uploader_id (
            first_name,
            last_name
          ),
          resource_courses (
            course_number,
            course_title
          )
        `)
        .eq("status", "approved")
        .order("uploaded_at", { ascending: false });

      if (error) throw error;

      setResources(
        resourcesData.map((r: any) => ({
          ...r,
          uploader: r.uploader,
          courses: r.resource_courses,
        }))
      );
    } catch (error: any) {
      console.error("Error fetching resources:", error);
      toast({
        title: "Error",
        description: "Failed to load resources",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = resources.filter((resource) => {
    // Search filter
    if (search && !resource.title.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }

    // Type filter
    if (typeFilter !== "all" && resource.resource_type !== typeFilter) {
      return false;
    }

    // Course filter (by department)
    if (courseFilter !== "all") {
      const matchesCourse = resource.courses?.some((course) =>
        course.course_number.startsWith(courseFilter)
      );
      if (!matchesCourse) return false;
    }

    return true;
  });

  return (
    <ReferralGuard minReferrals={1} featureName="Resources">
      <div className="container py-6">
        <div className="mb-4">
          <Button variant="outline" asChild size="sm" className="mb-6">
            <Link to="/" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Resources</h1>
              <p className="text-muted-foreground">
                Access and share study materials for your courses
              </p>
            </div>
            <Button onClick={() => setUploadModalOpen(true)} className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Resource
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Resources</TabsTrigger>
            <TabsTrigger value="my-uploads">My Uploads</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {/* Filters */}
            <ResourceFilters
              search={search}
              onSearchChange={setSearch}
              courseFilter={courseFilter}
              onCourseFilterChange={setCourseFilter}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
            />

            {/* Resources Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredResources.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No resources found</h3>
                <p className="text-muted-foreground mb-4">
                  {search || courseFilter !== "all" || typeFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Be the first to upload a resource!"}
                </p>
                {!search && courseFilter === "all" && typeFilter === "all" && (
                  <Button onClick={() => setUploadModalOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Resource
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-uploads">
            <MyUploadsTab />
          </TabsContent>
        </Tabs>

        {/* Upload Modal */}
        <UploadResourceModal
          open={uploadModalOpen}
          onOpenChange={setUploadModalOpen}
          onSuccess={fetchResources}
        />
      </div>
    </ReferralGuard>
  );
};

export default ResourcesPage;
