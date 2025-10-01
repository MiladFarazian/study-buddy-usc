
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { addCourseToProfile } from "@/lib/course-utils";
import { addTutorStudentCourse } from "@/lib/tutor-student-utils";
import { fetchCourseDetails } from "@/lib/scheduling/course-utils";
import { Book, BookOpen } from "lucide-react";

export interface CourseSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  courseNumber: string;
  courseTitle: string;
  instructor?: string | null;
  onSuccess: () => void;
}

export const CourseSelectionDialog = ({
  isOpen,
  onClose,
  courseNumber,
  courseTitle,
  instructor: propInstructor,
  onSuccess,
}: CourseSelectionDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selection, setSelection] = useState<"tutor" | "student">("tutor");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [instructors, setInstructors] = useState<string[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<string>("");
  const [loadingInstructors, setLoadingInstructors] = useState(false);

  // Fetch course details including instructors when dialog opens
  useEffect(() => {
    if (isOpen && courseNumber) {
      const loadInstructors = async () => {
        setLoadingInstructors(true);
        try {
          const courseDetails = await fetchCourseDetails(courseNumber);
          if (courseDetails?.instructor) {
            const instructorList = courseDetails.instructor
              .split(',')
              .map(i => i.trim())
              .filter(Boolean);
            setInstructors(instructorList);
            setSelectedInstructor(instructorList[0] || "");
          } else if (propInstructor) {
            const instructorList = propInstructor
              .split(',')
              .map(i => i.trim())
              .filter(Boolean);
            setInstructors(instructorList);
            setSelectedInstructor(instructorList[0] || "");
          }
        } catch (error) {
          console.error("Error fetching instructors:", error);
        } finally {
          setLoadingInstructors(false);
        }
      };
      loadInstructors();
    }
  }, [isOpen, courseNumber, propInstructor]);

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    
    // Debug log
    console.log("Selected option:", selection);

    try {
      if (selection === "tutor") {
        // Add as a course the user can tutor
        await addCourseToProfile(user.id, courseNumber, selectedInstructor || undefined);
        toast({
          title: "Course added as tutor subject",
          description: `${courseNumber} has been added to your courses to tutor${selectedInstructor ? ` with instructor ${selectedInstructor}` : ''}.`,
        });
      } else {
        // Add as a course the user needs help with
        await addTutorStudentCourse(user.id, courseNumber, selectedInstructor || undefined);
        toast({
          title: "Course added for help",
          description: `${courseNumber} has been added to courses you need help with${selectedInstructor ? ` with instructor ${selectedInstructor}` : ''}.`,
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error adding course:", error);
      toast({
        title: "Error adding course",
        description: "An error occurred while adding the course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add {courseNumber} to your profile</DialogTitle>
          <DialogDescription>
            {courseTitle ? `${courseTitle} - ` : ""}How would you like to add this course?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {instructors.length > 0 && (
            <div className="space-y-2">
              <Label>Select Instructor</Label>
              <Select 
                value={selectedInstructor} 
                onValueChange={setSelectedInstructor}
                disabled={loadingInstructors}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select instructor" />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map((instructor, index) => (
                    <SelectItem key={index} value={instructor}>
                      {instructor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <RadioGroup
            value={selection}
            onValueChange={(value: "tutor" | "student") => setSelection(value)}
            className="space-y-4"
          >
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="tutor" id="tutor" />
              <div className="grid gap-1.5 grow">
                <div className="flex items-center gap-2">
                  <Book className="h-4 w-4 text-usc-cardinal" />
                  <Label htmlFor="tutor" className="font-medium">
                    I can tutor this course
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  This course will appear in "My Courses" and on your tutor profile for students to book sessions with you.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="student" id="student" />
              <div className="grid gap-1.5 grow">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <Label htmlFor="student" className="font-medium">
                    I need help with this course
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  This course will appear in "Courses I Need Help With" and you'll see tutors who can help you with this course.
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-usc-cardinal hover:bg-usc-cardinal-dark"
          >
            {isSubmitting ? "Adding..." : "Add Course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Add default export to ensure both named and default exports are available
export default CourseSelectionDialog;
