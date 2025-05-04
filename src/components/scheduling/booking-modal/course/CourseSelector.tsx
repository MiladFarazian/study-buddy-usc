
import { useState, useEffect } from "react";
import { useScheduling } from "@/contexts/SchedulingContext";
import { Check, BookOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tutor } from "@/types/tutor";
import { cn } from "@/lib/utils";

interface CourseSelectorProps {
  tutor: Tutor | null;
  selectedCourseId: string | null;
  onCourseSelect: (courseId: string | null) => void;
}

export function CourseSelector({
  tutor,
  selectedCourseId,
  onCourseSelect
}: CourseSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { setCourse } = useScheduling();
  
  // Filter courses based on search query
  const filteredCourses = tutor?.subjects.filter(subject => 
    subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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
            filteredCourses.map((subject) => (
              <Button
                key={subject.code}
                variant="outline"
                className={cn(
                  "w-full justify-start text-left",
                  selectedCourseId === subject.code ? "border-usc-cardinal border-2" : ""
                )}
                onClick={() => handleSelectCourse(subject.code)}
              >
                <div className="flex justify-between w-full items-center">
                  <div>
                    <p className="font-medium">{subject.code}</p>
                    <p className="text-sm text-muted-foreground">{subject.name}</p>
                  </div>
                  {selectedCourseId === subject.code && (
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
      </div>
    </div>
  );
}
