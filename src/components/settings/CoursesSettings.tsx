
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export const CoursesSettings = () => {
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [removingCourse, setRemovingCourse] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const handleRemoveCourse = async (courseNumber: string) => {
    if (!user) return;
    
    try {
      setRemovingCourse(courseNumber);
      await removeCourseFromProfile(user.id, courseNumber);
      
      // Update local state
      if (profile && updateProfile) {
        const updatedSubjects = profile.subjects?.filter(
          (subject) => subject !== courseNumber
        ) || [];
        
        updateProfile({ subjects: updatedSubjects });
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
      </CardHeader>
      <CardContent>
        {profile?.subjects && profile.subjects.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              These are the courses you've added to your profile. 
              {profile.role === 'tutor' && " As a tutor, these courses will be displayed on your tutor profile."}
            </p>
            
            <div className="flex flex-wrap gap-2">
              {profile.subjects.map((course) => (
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
          <p className="text-sm text-muted-foreground">
            You haven't added any courses yet. Browse the courses page to add courses to your profile.
          </p>
        )}
        
        {/* Confirmation dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Course</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove {selectedCourse} from your profile? 
                {profile?.role === 'tutor' && " This will also remove it from your tutor profile."}
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
