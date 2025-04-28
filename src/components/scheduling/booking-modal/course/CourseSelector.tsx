
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Course } from "@/types/CourseTypes";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface CourseSelectorProps {
  courses: Course[];
  selectedCourseId: string | null;
  onSelectCourse: (courseId: string | null) => void;
  onBack: () => void;
  loading: boolean;
}

export function CourseSelector({
  courses,
  selectedCourseId,
  onSelectCourse,
  onBack,
  loading
}: CourseSelectorProps) {
  const handleContinue = () => {
    // Pass the selected course ID (which might be null for "General Session")
    onSelectCourse(selectedCourseId);
  };
  
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center mb-4">
          <Button variant="ghost" onClick={onBack} className="pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h3 className="text-xl font-semibold ml-2">Select Class</h3>
        </div>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-usc-cardinal"></div>
          <span className="ml-2">Loading courses...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <Button variant="ghost" onClick={onBack} className="pl-0">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h3 className="text-xl font-semibold ml-2">Select Class</h3>
      </div>
      
      <RadioGroup value={selectedCourseId || ''} onValueChange={(value) => onSelectCourse(value || null)}>
        <div className="space-y-3">
          {/* Option for general session without a specific course */}
          <div className={`
            flex items-center justify-between rounded-lg border p-4
            ${selectedCourseId === null ? "border-usc-cardinal" : ""}
          `}>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="" id="general-session" />
              <Label htmlFor="general-session" className="cursor-pointer">
                <div>
                  <span className="font-medium">General Session</span>
                  <p className="text-sm text-muted-foreground">
                    Not specific to any particular class
                  </p>
                </div>
              </Label>
            </div>
          </div>
          
          {/* Tutor's courses */}
          {courses.length > 0 ? (
            courses.map((course) => (
              <div 
                key={course.course_number}
                className={`
                  flex items-center justify-between rounded-lg border p-4
                  ${selectedCourseId === course.course_number ? "border-usc-cardinal" : ""}
                `}
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value={course.course_number} id={`course-${course.course_number}`} />
                  <Label htmlFor={`course-${course.course_number}`} className="cursor-pointer">
                    <div>
                      <span className="font-medium">{course.course_number}</span>
                      <p className="text-sm text-muted-foreground">
                        {course.course_title}
                      </p>
                    </div>
                  </Label>
                </div>
              </div>
            ))
          ) : (
            <Card className="p-4 text-center text-muted-foreground">
              No specific courses available
            </Card>
          )}
        </div>
      </RadioGroup>
      
      <div className="mt-8 flex justify-end">
        <Button 
          className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white" 
          onClick={handleContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
