
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Course } from "@/types/CourseTypes";
import { Button } from "@/components/ui/button";
import { PlusCircle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { addCourseToProfile } from "@/lib/course-utils";

interface CourseCardProps {
  course: Course;
}

const CourseCard = ({ course }: CourseCardProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(() => {
    if (!profile?.subjects) return false;
    return profile.subjects.includes(course.course_number);
  });
  
  // Get the course number and title
  const courseNumber = course.course_number || '';
  const courseTitle = course.course_title || '';
  const department = course.department || '';
  const instructor = course.instructor || '';
  const description = course.description || null;
  
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
      await addCourseToProfile(user.id, course);
      setIsAdded(true);
      toast({
        title: "Course added",
        description: `${courseNumber} has been added to your profile`,
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
          {instructor && (
            <div className="flex">
              <span className="font-medium w-24">Instructor:</span> 
              <span className="text-gray-700 line-clamp-1 flex-1">{instructor}</span>
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
        
        {user && (
          <Button 
            onClick={handleAddCourse}
            disabled={isAdding || isAdded}
            variant={isAdded ? "outline" : "default"}
            className="w-full mt-4"
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
      </CardContent>
    </Card>
  );
};

export default CourseCard;
