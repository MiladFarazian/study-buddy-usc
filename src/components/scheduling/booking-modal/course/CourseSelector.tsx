
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTutorCourses } from "@/hooks/useTutorCourses";
import { Tutor } from "@/types/tutor";
import { Course } from "@/types/CourseTypes";
import { Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useScheduling } from "@/contexts/SchedulingContext";
import { useAuth } from "@/contexts/AuthContext";
import { getStudentCoursesWithInstructor, CourseMatch } from "@/lib/instructor-matching-utils";

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
  const { user } = useAuth();
  const [studentCourses, setStudentCourses] = useState<CourseMatch[]>([]);
  
  // Fetch student courses for matching
  useEffect(() => {
    const fetchStudentCourses = async () => {
      if (user?.id) {
        const courses = await getStudentCoursesWithInstructor(user.id);
        setStudentCourses(courses);
      }
    };
    fetchStudentCourses();
  }, [user?.id]);
  
  // Use external courses if provided, otherwise use the fetched courses
  const courses = externalCourses || fetchedCourses;
  // Use external loading state if provided, otherwise use the fetch loading state
  const loading = externalLoading !== undefined ? externalLoading : fetchLoading;
  
  // Helper function to determine match type for a course
  const getMatchType = (course: Course): 'exact' | 'student-course' | 'none' => {
    const studentCourse = studentCourses.find(sc => sc.course_number === course.course_number);
    if (!studentCourse) return 'none';
    
    // Normalize instructor names for comparison
    const normalizeInstructor = (instructor: string | null | undefined): string => {
      if (!instructor) return '';
      return instructor.toLowerCase().trim();
    };
    
    const studentInstructor = normalizeInstructor(studentCourse.instructor);
    const tutorInstructor = normalizeInstructor(course.instructor);
    
    if (studentInstructor && tutorInstructor && studentInstructor === tutorInstructor) {
      return 'exact';
    }
    
    return 'student-course';
  };
  
  // Sort courses: exact matches first, student courses second, others last
  const sortedCourses = courses ? [...courses].sort((a, b) => {
    const matchTypeA = getMatchType(a);
    const matchTypeB = getMatchType(b);
    
    const priority = { 'exact': 0, 'student-course': 1, 'none': 2 };
    return priority[matchTypeA] - priority[matchTypeB];
  }) : [];
  
  // Update local state when selectedCourseId prop changes
  useEffect(() => {
    setLocalSelectedCourseId(selectedCourseId);
    setNoSpecificCourse(selectedCourseId === null);
  }, [selectedCourseId]);

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
              
              {sortedCourses && sortedCourses.length > 0 ? (
                sortedCourses.map((course: Course) => {
                  const matchType = getMatchType(course);
                  const isSelected = localSelectedCourseId === course.course_number && !noSpecificCourse;
                  
                  // Determine background color based on match type
                  let bgClass = "";
                  let borderClass = "border";
                  let textColorClass = "";
                  
                  if (matchType === 'exact') {
                    bgClass = "bg-emerald-50 dark:bg-emerald-950/30";
                    borderClass = "border-emerald-500";
                    textColorClass = "text-emerald-700 dark:text-emerald-400";
                  } else if (matchType === 'student-course') {
                    bgClass = "bg-red-50 dark:bg-red-950/30";
                    borderClass = "border-red-400";
                    textColorClass = "text-red-700 dark:text-red-400";
                  } else {
                    bgClass = "bg-amber-50 dark:bg-amber-950/30";
                    borderClass = isSelected ? "border-usc-cardinal" : "border";
                  }
                  
                  return (
                    <div 
                      key={course.course_number}
                      className={`
                        flex items-center space-x-2 rounded-lg p-4 cursor-pointer
                        ${bgClass} ${isSelected ? "border-usc-cardinal border-2" : borderClass}
                      `}
                      onClick={() => handleCourseSelect(course.course_number)}
                    >
                      <RadioGroupItem value={course.course_number} id={`course-${course.course_number}`} />
                      <Label htmlFor={`course-${course.course_number}`} className="cursor-pointer flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{course.course_number}</div>
                          {matchType !== 'none' && (
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${textColorClass}`}>
                              <Check className="w-3 h-3" />
                              {matchType === 'exact' ? 'Exact Match' : 'Your Course'}
                            </div>
                          )}
                        </div>
                        {course.course_title && (
                          <p className="text-sm text-muted-foreground">{course.course_title}</p>
                        )}
                      </Label>
                    </div>
                  );
                })
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
