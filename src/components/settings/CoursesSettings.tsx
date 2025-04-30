
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/useCourses";
import { CourseSelectionDialog } from "@/components/courses/CourseSelectionDialog";
import CourseCard from "@/components/courses/CourseCard"; // Fixed import to use default import
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { CourseFilterOptions } from "@/types/CourseTypes";

export const CoursesSettings = () => {
  const { profile, updateProfile } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Fixed CourseFilterOptions object structure
  const filterOptions: CourseFilterOptions = {
    term: "",
    search: "",
    department: "all"
  };
  
  const { courses, loading } = useCourses(filterOptions);
  
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
              <CourseCard key={course.id} course={course} />
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
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          courseNumber=""
          courseTitle=""
          onSuccess={() => {}}
        />
      </CardContent>
    </Card>
  );
};

export default CoursesSettings;
