
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { addCourseToProfile } from "@/lib/course-utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CourseSelectionDialog } from "./CourseSelectionDialog";

interface CourseCardActionsProps {
  courseNumber: string;
  courseTitle: string;
  onCourseAdded?: () => void;
}

export function CourseCardActions({ 
  courseNumber, 
  courseTitle,
  onCourseAdded 
}: CourseCardActionsProps) {
  const { user, profile, isTutor } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  // Debug logs
  console.log("User is tutor:", isTutor);

  const handleAddCourse = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add courses to your profile",
        variant: "destructive",
      });
      return;
    }

    // For tutors, show the selection dialog
    if (isTutor) {
      console.log("Showing course purpose dialog");
      setShowDialog(true);
      return;
    }

    // For students, directly add the course
    setLoading(true);
    try {
      await addCourseToProfile(user.id, courseNumber);
      toast({
        title: "Course added",
        description: `${courseNumber} has been added to your profile`,
      });
      if (onCourseAdded) onCourseAdded();
    } catch (error) {
      console.error("Failed to add course:", error);
      toast({
        title: "Failed to add course",
        description: "An error occurred while adding the course",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isAdded = profile?.subjects?.includes(courseNumber);

  if (isAdded) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
        disabled
      >
        Added
      </Button>
    );
  }

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="border-usc-cardinal text-usc-cardinal hover:bg-red-50"
        onClick={handleAddCourse}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <Plus className="h-4 w-4 mr-1" />
        )}
        {isTutor ? "Add Course" : "Add to My Courses"}
      </Button>
      
      {isTutor && (
        <CourseSelectionDialog
          isOpen={showDialog}
          onClose={() => setShowDialog(false)}
          courseNumber={courseNumber}
          courseTitle={courseTitle}
          onSuccess={() => {
            if (onCourseAdded) onCourseAdded();
          }}
        />
      )}
    </>
  );
}

// Add default export for flexibility
export default CourseCardActions;
