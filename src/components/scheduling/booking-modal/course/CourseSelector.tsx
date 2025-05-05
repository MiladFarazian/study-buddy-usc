
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTutorCourses } from "@/hooks/useTutorCourses";
import { Tutor } from "@/types/tutor";
import { Course } from "@/types/CourseTypes";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useScheduling } from "@/contexts/SchedulingContext";

interface CourseSelectorProps {
  selectedCourseId: string | null;
  onCourseSelect: (courseId: string | null) => void;
  tutor: Tutor;
  onBack?: () => void;
  onContinue?: () => void;
  loading?: boolean;
  courses?: Course[];
}

export function CourseSelector({ 
  selectedCourseId, 
  onCourseSelect, 
  tutor,
  onBack,
  onContinue,
  loading: externalLoading,
  courses: externalCourses
}: CourseSelectorProps) {
  const { courses: fetchedCourses, loading: fetchLoading } = useTutorCourses(tutor.id);
  const [noSpecificCourse, setNoSpecificCourse] = useState<boolean>(selectedCourseId === null);
  const [localSelectedCourseId, setLocalSelectedCourseId] = useState<string | null>(selectedCourseId);
  const { setCourse } = useScheduling();
  
  // Use external courses if provided, otherwise use the fetched courses
  const courses = externalCourses || fetchedCourses;
  // Use external loading state if provided, otherwise use the fetch loading state
  const loading = externalLoading !== undefined ? externalLoading : fetchLoading;
  
  // Initialize with "No specific course" selected
  useEffect(() => {
    if (courses?.length > 0 && selectedCourseId === null) {
      setNoSpecificCourse(true);
    }
  }, [courses, selectedCourseId]);

  const handleCourseSelect = (courseId: string) => {
    console.log("Course selected in CourseSelector:", courseId);
    setNoSpecificCourse(false);
    setLocalSelectedCourseId(courseId);
    onCourseSelect(courseId);
    setCourse(courseId); // Update context state
  };
  
  const handleNoSpecificCourse = () => {
    console.log("No specific course selected in CourseSelector");
    setNoSpecificCourse(true);
    setLocalSelectedCourseId(null);
    onCourseSelect(null);
    setCourse(null); // Update context state
  };
  
  const handleContinueClick = () => {
    // Pass the selected course ID when continuing
    if (onContinue) {
      // Ensure the selected course is properly set in context
      if (noSpecificCourse) {
        setCourse(null);
        onCourseSelect(null);
      } else if (localSelectedCourseId) {
        setCourse(localSelectedCourseId);
        onCourseSelect(localSelectedCourseId);
      }
      onContinue();
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
        <h3 className="text-xl font-semibold ml-2">Select Course</h3>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-usc-cardinal mr-2" />
          <p>Loading courses...</p>
        </div>
      ) : (
        <>
          <RadioGroup 
            value={noSpecificCourse ? "no-course" : (localSelectedCourseId || "")}
            onValueChange={(value) => {
              if (value === "no-course") {
                handleNoSpecificCourse();
              } else {
                handleCourseSelect(value);
              }
            }}
          >
            <div className="space-y-3">
              <div 
                className={`
                  flex items-center space-x-2 rounded-lg border p-4 cursor-pointer
                  ${noSpecificCourse ? "border-usc-cardinal bg-red-50" : ""}
                `}
                onClick={handleNoSpecificCourse}
              >
                <RadioGroupItem value="no-course" id="no-course" />
                <Label htmlFor="no-course" className="cursor-pointer flex-1">
                  <div className="font-medium">General Tutoring Session</div>
                  <p className="text-sm text-muted-foreground">Not specific to any particular class</p>
                </Label>
              </div>
              
              {courses && courses.length > 0 ? (
                courses.map((course: Course) => (
                  <div 
                    key={course.course_number}
                    className={`
                      flex items-center space-x-2 rounded-lg border p-4 cursor-pointer
                      ${localSelectedCourseId === course.course_number && !noSpecificCourse ? "border-usc-cardinal bg-red-50" : ""}
                    `}
                    onClick={() => handleCourseSelect(course.course_number)}
                  >
                    <RadioGroupItem value={course.course_number} id={`course-${course.course_number}`} />
                    <Label htmlFor={`course-${course.course_number}`} className="cursor-pointer flex-1">
                      <div className="font-medium">{course.course_number}</div>
                      {course.course_title && (
                        <p className="text-sm text-muted-foreground">{course.course_title}</p>
                      )}
                    </Label>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground">This tutor hasn't added any courses yet.</p>
                </div>
              )}
            </div>
          </RadioGroup>

          {(onBack || onContinue) && (
            <div className="flex justify-between pt-4 mt-6">
              {onBack && (
                <Button variant="outline" onClick={onBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
              
              {onContinue && (
                <Button 
                  className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
                  onClick={handleContinueClick}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
