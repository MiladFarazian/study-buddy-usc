
import { Course } from "@/types/CourseTypes";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface CourseListViewProps {
  courses: Course[];
  loading: boolean;
  selectedTerm: string;
  onImportComplete: () => void;
}

const CourseListView = ({ 
  courses, 
  loading, 
  selectedTerm, 
  onImportComplete 
}: CourseListViewProps) => {
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-usc-cardinal"></div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">No courses found</h3>
        <p className="text-muted-foreground mb-4">
          {selectedTerm ? "Try adjusting your search or filters" : "Please select a term"}
        </p>
        {user && selectedTerm && (
          <Button onClick={() => onImportComplete()}>
            Import USC Courses
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="divide-y">
      {courses.map((course) => (
        <div key={course.id} className="py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{course.course_number || course.code}</h3>
                <span className="text-sm text-muted-foreground">{course.course_title || course.name}</span>
              </div>
              <p className="text-sm line-clamp-2">{course.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">View Details</Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CourseListView;
