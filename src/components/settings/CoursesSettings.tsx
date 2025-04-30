
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/useCourses";
import { CourseSelectionDialog } from "@/components/courses/CourseSelectionDialog";
import { CourseCard } from "@/components/courses/CourseCard";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";

export const CoursesSettings = () => {
  const { profile, updateProfile } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { courses, loading } = useCourses(profile?.id);
  
  const onSelectedCoursesChange = async (selectedSubjects: string[]) => {
    if (!profile) return;
    
    try {
      // Only update the subjects field
      await updateProfile({
        ...profile,
        subjects: selectedSubjects
      });
    } catch (error) {
      console.error("Error updating courses:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Courses</CardTitle>
        <CardDescription>
          Manage the courses you're taking or teaching
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Button 
            onClick={() => setDialogOpen(true)} 
            variant="outline" 
            className="flex gap-2"
          >
            <Plus className="h-4 w-4" /> 
            Add Courses
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal" />
            </div>
          ) : courses?.length ? (
            courses.map(course => (
              <CourseCard key={course.id} course={course} showActions={true} />
            ))
          ) : (
            <div className="col-span-full bg-muted rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No Courses Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Click "Add Courses" to add courses to your profile
              </p>
            </div>
          )}
        </div>

        <CourseSelectionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title="Select Your Courses"
          description="Search and select the courses you want to add to your profile"
          onConfirm={onSelectedCoursesChange}
        />
      </CardContent>
    </Card>
  );
};

export default CoursesSettings;
