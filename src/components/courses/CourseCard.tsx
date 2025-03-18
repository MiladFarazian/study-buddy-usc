
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Course } from "@/types/CourseTypes";

interface CourseCardProps {
  course: Course;
}

const CourseCard = ({ course }: CourseCardProps) => {
  // Get the course number and title, handling both new and old data structure
  const courseNumber = course.course_number || course.code || '';
  const courseTitle = course.course_title || course.name || '';
  const department = course.department || '';
  const instructor = course.instructor || '';
  const description = course.description || null;
  
  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">
            {courseNumber}
          </CardTitle>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            {department}
          </Badge>
        </div>
        <h3 className="font-medium mt-1">{courseTitle}</h3>
      </CardHeader>
      <CardContent>
        {description && (
          <p className="text-sm text-gray-600 line-clamp-3 mb-3">{description}</p>
        )}
        
        <div className="space-y-1 text-sm">
          {instructor && (
            <div className="flex">
              <span className="font-medium w-24">Instructor:</span> 
              <span className="text-gray-700">{instructor}</span>
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
              <span className="text-gray-700">
                {[course.days, course.time].filter(Boolean).join(' ')}
              </span>
            </div>
          )}
          
          {course.location && (
            <div className="flex">
              <span className="font-medium w-24">Location:</span> 
              <span className="text-gray-700">{course.location}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseCard;
