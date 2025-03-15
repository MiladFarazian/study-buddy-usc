
import { Course } from "@/integrations/supabase/types-extension";
import CourseCard from "./CourseCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface CourseGridViewProps {
  courses: Course[];
  loading: boolean;
  selectedTerm: string;
  onImportComplete: () => void;
}

const CourseGridView = ({ 
  courses, 
  loading, 
  selectedTerm, 
  onImportComplete 
}: CourseGridViewProps) => {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
};

export default CourseGridView;
