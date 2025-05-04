
import { useState } from "react";
import { useScheduling } from "@/contexts/SchedulingContext";
import { Check, BookOpen, Search, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Course } from "@/types/CourseTypes";
import { Tutor } from "@/types/tutor";
import { useTutorCourses } from "@/hooks/useTutorCourses";

interface CourseSelectorProps {
  selectedCourseId: string | null;
  onCourseSelect: (courseId: string | null) => void;
  onBack?: () => void;
  loading?: boolean;
  courses?: Course[];
  tutor?: Tutor;
}

export function CourseSelector({
  selectedCourseId,
  onCourseSelect,
  onBack,
  loading = false,
  courses: propsCourses,
  tutor
}: CourseSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { setCourse } = useScheduling();
  
  // Fetch courses if they weren't provided as props
  const { courses: fetchedCourses, loading: coursesLoading } = useTutorCourses(tutor?.id);
  
  // Use courses from props if available, otherwise use fetched courses
  const courses = propsCourses || fetchedCourses || [];
  const isLoading = loading || coursesLoading;
  
  // Filter courses based on search query
  const filteredCourses = courses.filter(course => 
    course.course_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.course_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle course selection
  const handleSelectCourse = (courseId: string) => {
    onCourseSelect(courseId);
    setCourse(courseId);
  };

  // Option to not select a specific course
  const handleSkip = () => {
    onCourseSelect(null);
    setCourse(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-usc-cardinal"></div>
        <span className="ml-2">Loading courses...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="mr-2 p-0">
            <ArrowLeft className="h-4 w-4" />
            <span className="ml-2">Back</span>
          </Button>
        )}
        <h3 className="text-xl font-semibold">Select Class</h3>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses"
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <div
                key={course.course_number}
                className={cn(
                  "border rounded-md p-4 cursor-pointer hover:border-usc-cardinal",
                  selectedCourseId === course.course_number ? "border-usc-cardinal border-2" : ""
                )}
                onClick={() => handleSelectCourse(course.course_number)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <div className={cn(
                      "w-5 h-5 rounded-full border flex items-center justify-center",
                      selectedCourseId === course.course_number ? "border-usc-cardinal bg-usc-cardinal" : "border-gray-300"
                    )}>
                      {selectedCourseId === course.course_number && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">{course.course_number}</p>
                    <p className="text-sm text-muted-foreground">{course.course_title}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              {searchQuery ? "No courses match your search" : "No courses available"}
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          className="w-full mt-2"
          onClick={handleSkip}
        >
          I don't need a specific course
        </Button>
      </div>
    </div>
  );
}
