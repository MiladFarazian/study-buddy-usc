
import { useState } from "react";
import { useScheduling } from "@/contexts/SchedulingContext";
import { Check, BookOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Course } from "@/types/CourseTypes";
import { Tutor } from "@/types/tutor";

interface CourseSelectorProps {
  selectedCourseId: string | null;
  onCourseSelect: (courseId: string | null) => void;
  onBack?: () => void;
  loading?: boolean;
  courses?: Course[];
  tutor?: Tutor; // Added tutor prop to the interface
}

export function CourseSelector({
  selectedCourseId,
  onCourseSelect,
  onBack,
  loading = false,
  courses = [],
  tutor // Added tutor parameter
}: CourseSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { setCourse } = useScheduling();
  
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-usc-cardinal"></div>
        <span className="ml-2">Loading courses...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold flex items-center">
          <BookOpen className="mr-2 h-5 w-5" />
          Select a Course
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Choose which course you need help with.
        </p>
      </div>

      <div className="border rounded-md p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses"
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid gap-2 max-h-60 overflow-y-auto">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <Button
                key={course.course_number}
                variant="outline"
                className={cn(
                  "w-full justify-start text-left",
                  selectedCourseId === course.course_number ? "border-usc-cardinal border-2" : ""
                )}
                onClick={() => handleSelectCourse(course.course_number)}
              >
                <div className="flex justify-between w-full items-center">
                  <div>
                    <p className="font-medium">{course.course_number}</p>
                    <p className="text-sm text-muted-foreground">{course.course_title}</p>
                  </div>
                  {selectedCourseId === course.course_number && (
                    <Check className="h-4 w-4 text-usc-cardinal" />
                  )}
                </div>
              </Button>
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

        {onBack && (
          <Button 
            variant="outline" 
            className="w-full mt-2"
            onClick={onBack}
          >
            Back
          </Button>
        )}
      </div>
    </div>
  );
}
