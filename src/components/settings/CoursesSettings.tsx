
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { removeCourseFromProfile } from "@/lib/course-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CoursesSettingsProps {
  profileView?: 'student' | 'tutor';
}

export const CoursesSettings = ({ profileView }: CoursesSettingsProps) => {
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [removingCourse, setRemovingCourse] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  // Determine which view to show - use prop if available, otherwise default to student
  const currentView = profileView || 'student';
  const isStudentView = currentView === 'student';
  const isTutorView = currentView === 'tutor';

  // Get the appropriate courses array based on profile view
  const getUserCourses = () => {
    if (!profile) return [];
    
    if (isStudentView) {
      return profile.student_courses || [];
    } else {
      return profile.tutor_courses_subjects || [];
    }
  };

  const handleRemoveCourse = async (courseNumber: string) => {
    if (!user) return;
    
    try {
      setRemovingCourse(courseNumber);
      await removeCourseFromProfile(user.id, courseNumber);
      
      // Update local state based on current view
      if (profile && updateProfile) {
        if (isStudentView) {
          const updatedCourses = (profile.student_courses || []).filter(
            (course) => course !== courseNumber
          );
          updateProfile({ ...profile, student_courses: updatedCourses });
        } else {
          const updatedCourses = (profile.tutor_courses_subjects || []).filter(
            (subject) => subject !== courseNumber
          );
          updateProfile({ ...profile, tutor_courses_subjects: updatedCourses });
        }
      }
      
      toast({
        title: "Course removed",
        description: `${courseNumber} has been removed from your profile`,
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
        <CardTitle>My Courses</CardTitle>
        <CardDescription>
          {isTutorView
            ? "The courses you add here will appear to students when they book a tutoring session with you. Add courses that you're qualified to tutor."
            : "Add courses that you need help with to find matching tutors and get personalized recommendations."
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {getUserCourses().length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              {isTutorView
                ? "These are the courses you can tutor. They will be displayed to students during the booking process."
                : "These are the courses you need help with. You'll see tutors who can help with these courses."
              }
            </p>
            
            <div className="flex flex-wrap gap-2">
              {getUserCourses().map((course) => (
                <div key={course} className="relative inline-flex">
                  <Badge variant="secondary" className="pr-8 py-2">
                    {course}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 absolute right-1 rounded-full"
                      onClick={() => openRemoveDialog(course)}
                      disabled={removingCourse === course}
                    >
                      {removingCourse === course ? (
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
              {isTutorView
                ? "You haven't added any courses you can tutor yet. Add courses to make them available during booking."
                : "You haven't added any courses you need help with yet. Add courses to find matching tutors."
              }
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
                Are you sure you want to remove {selectedCourse} from your profile? 
                {isTutorView && " This will also remove it from your tutor profile and it won't be available to select during booking."}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2">
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
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CoursesSettings;
