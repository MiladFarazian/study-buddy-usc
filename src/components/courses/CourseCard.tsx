
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Course } from "@/integrations/supabase/types-extension";

interface CourseCardProps {
  course: Course;
}

const CourseCard = ({ course }: CourseCardProps) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">
            {course.code}
          </CardTitle>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            {course.department}
          </Badge>
        </div>
        <h3 className="text-md font-medium">{course.name}</h3>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 line-clamp-4">{course.description}</p>
        
        {course.instructor && (
          <div className="mt-3 text-sm">
            <span className="font-medium">Instructor:</span> {course.instructor}
          </div>
        )}
        
        {course.units && (
          <div className="mt-1 text-sm">
            <span className="font-medium">Units:</span> {course.units}
          </div>
        )}
        
        {(course.days || course.time) && (
          <div className="mt-1 text-sm">
            <span className="font-medium">Schedule:</span> {course.days} {course.time}
          </div>
        )}
        
        {course.location && (
          <div className="mt-1 text-sm">
            <span className="font-medium">Location:</span> {course.location}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CourseCard;
