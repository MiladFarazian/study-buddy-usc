import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Course } from "@/types/CourseTypes";
import { Button } from "@/components/ui/button";
import { PlusCircle, CheckCircle, Users } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { addCourseToProfile } from "@/lib/course-utils";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CourseCardProps {
  course: Course;
}

const CourseCard = ({ course }: CourseCardProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(() => {
    if (!profile) return false;
    if (profile.approved_tutor) {
      return profile.tutor_courses_subjects?.includes(course.course_number) || false;
    } else {
      return profile.student_courses?.includes(course.course_number) || false;
    }
  });
  
  // Get the course number and title
  const courseNumber = course.course_number || '';
  const courseTitle = course.course_title || '';
  const department = course.department || '';
  const description = course.description || null;
  
  // Handle multiple instructors
  const instructorString = course.instructor || '';
  const instructors = instructorString.split(',').map(instr => instr.trim()).filter(Boolean);
  const hasMultipleInstructors = instructors.length > 1;
  
  // State for selected instructor
  const [selectedInstructor, setSelectedInstructor] = useState(instructors[0] || '');
  
  const handleAddCourse = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add courses to your profile",
        variant: "destructive",
      });
      return;
    }
    
    setIsAdding(true);
    try {
      // Pass course details so we persist title and department reliably
      await addCourseToProfile(
        user.id,
        course.course_number,
        selectedInstructor || undefined,
        courseTitle,
        department
      );
      setIsAdded(true);
      toast({
        title: "Course added",
        description: `${courseNumber} has been added to your profile${selectedInstructor ? ` with instructor ${selectedInstructor}` : ''}`,
      });
    } catch (error) {
      console.error("Failed to add course:", error);
      toast({
        title: "Failed to add course",
        description: "An error occurred while adding the course",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };
  
  return (
    
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">
            {courseNumber}
          </CardTitle>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            {department}
          </Badge>
        </div>
        <h3 className="font-medium mt-1 min-h-[3rem] line-clamp-2">{courseTitle}</h3>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow">
        {description && (
          <p className="text-sm text-gray-600 line-clamp-3 mb-4">{description}</p>
        )}
        
        <div className="space-y-1 text-sm mb-auto">
          {instructorString && (
            <div className="flex">
              <span className="font-medium w-24">Instructor:</span> 
              <div className="text-gray-700 line-clamp-1 flex-1">
                {hasMultipleInstructors ? (
                  <Select 
                    value={selectedInstructor} 
                    onValueChange={setSelectedInstructor}
                  >
                    <SelectTrigger className="w-full h-7 text-xs px-2 py-0 border-none bg-gray-50">
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
                ) : (
                  instructorString
                )}
              </div>
            </div>
          )}
          
          {course.units && (
            <div className="flex">
              <span className="font-medium w-24">Units:</span> 
              <span className="text-gray-700">{course.units}</span>
            </div>
          )}
          
          {(course.days || course.time) && (
            <div className="flex">
              <span className="font-medium w-24">Schedule:</span> 
              <span className="text-gray-700 line-clamp-1 flex-1">
                {[course.days, course.time].filter(Boolean).join(' ')}
              </span>
            </div>
          )}
          
          {course.location && (
            <div className="flex">
              <span className="font-medium w-24">Location:</span> 
              <span className="text-gray-700 line-clamp-1 flex-1">{course.location}</span>
            </div>
          )}
        </div>
        
        <div className="space-y-2 mt-4">
          {user && (
            <Button 
              onClick={handleAddCourse}
              disabled={isAdding || isAdded}
              variant={isAdded ? "outline" : "default"}
              className="w-full"
            >
              {isAdding ? (
                <>Loading...</>
              ) : isAdded ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  Added to My Courses
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add to My Courses
                </>
              )}
            </Button>
          )}
          
          <Button 
            asChild
            variant="outline"
            className="w-full"
          >
            <Link to={`/tutors?search=${encodeURIComponent(courseNumber)}`}>
              <Users className="mr-2 h-4 w-4" />
              Find Tutors
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseCard;
