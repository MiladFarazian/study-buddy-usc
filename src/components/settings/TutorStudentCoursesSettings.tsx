import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTutorStudentCourses } from "@/hooks/useTutorStudentCourses";
import { removeTutorStudentCourse } from "@/lib/tutor-student-utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const TutorStudentCoursesSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { courses, loading: loadingCourses } = useTutorStudentCourses();
  const [removingCourse, setRemovingCourse] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const handleRemoveCourse = async (courseNumber: string) => {
    if (!user) return;
    
    try {
      setRemovingCourse(courseNumber);
      await removeTutorStudentCourse(user.id, courseNumber);
      
      toast({
        title: "Course removed",
        description: `${courseNumber} has been removed from courses you need help with`,
      });
      
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to remove course:", error);
      toast({
        title: "Failed to remove course",
        description: "An error occurred while removing the course",
        variant: "destructive",
      });
    } finally {
      setRemovingCourse(null);
      setSelectedCourse(null);
    }
  };

  const openRemoveDialog = (courseNumber: string) => {
    setSelectedCourse(courseNumber);
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Courses I Need Help With</CardTitle>
        <CardDescription>
          These are courses you've added as a student seeking tutoring help. Tutors who teach these courses will appear in your recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loadingCourses ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : courses.length > 0 ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {courses.map((course) => (
                <div key={course.id} className="relative inline-flex">
                  <Badge variant="secondary" className="pr-8 py-2">
                    {course.course_number}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 absolute right-1 rounded-full"
                      onClick={() => openRemoveDialog(course.course_number)}
                      disabled={removingCourse === course.course_number}
                    >
                      {removingCourse === course.course_number ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      <span className="sr-only">Remove</span>
                    </Button>
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">
              You haven't added any courses that you need help with yet.
              Browse courses to add some.
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/courses'}>
              Browse Courses
            </Button>
          </div>
        )}
        
        {/* Confirmation dialog */}
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Course</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove {selectedCourse} from courses you need help with?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDialogOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => selectedCourse && handleRemoveCourse(selectedCourse)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {removingCourse ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

// Adding default export alongside named export
export default TutorStudentCoursesSettings;
