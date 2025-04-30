
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { removeTutorStudentCourse } from "@/lib/tutor-student-utils";
import { useTutorStudentCourses } from "@/hooks/useTutorStudentCourses";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const TutorStudentCoursesSettings = () => {
  const { user, isTutor } = useAuth();
  const { toast } = useToast();
  const { courses, loading } = useTutorStudentCourses();
  const [removingCourse, setRemovingCourse] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  // Only show for tutor accounts
  if (!isTutor) {
    return null;
  }

  const handleRemoveCourse = async (courseNumber: string) => {
    if (!user) return;
    
    try {
      setRemovingCourse(courseNumber);
      await removeTutorStudentCourse(user.id, courseNumber);
      
      toast({
        title: "Course removed",
        description: `${courseNumber} has been removed from your courses you need help with`,
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
          These courses will be used to show you tutors who can help with subjects you're studying.
          You'll see personalized tutor recommendations on the Tutors page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-usc-cardinal" />
            <span className="ml-2 text-sm">Loading courses...</span>
          </div>
        ) : courses && courses.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              These are the courses you've added that you need help with. You'll see tutors who teach these courses in the "Tutors for Your Learning Needs" section on the Tutors page.
            </p>
            
            <div className="flex flex-wrap gap-2">
              {courses.map((course) => (
                <div key={course.course_number} className="relative inline-flex">
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
              Browse the courses page to add courses you're studying.
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/courses'}>
              Browse Courses
            </Button>
          </div>
        )}
        
        {/* Confirmation dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Course</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove {selectedCourse} from your "Courses I Need Help With"?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => selectedCourse && handleRemoveCourse(selectedCourse)}
                disabled={removingCourse !== null}
              >
                {removingCourse ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
