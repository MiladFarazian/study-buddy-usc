
import { Card, CardContent } from "@/components/ui/card";
import TermSelector from "./TermSelector";
import CourseFilters from "./CourseFilters";
import ImportCoursesButton from "./ImportCoursesButton";
import { useAuth } from "@/contexts/AuthContext";

interface CourseFilterPanelProps {
  selectedTerm: string;
  searchQuery: string;
  selectedDepartment: string;
  departments: Array<{ code: string; name: string }>;
  onTermChange: (termCode: string) => void;
  onSearchChange: (query: string) => void;
  onDepartmentChange: (department: string) => void;
  onImportComplete: () => void;
}

const CourseFilterPanel = ({
  selectedTerm,
  searchQuery,
  selectedDepartment,
  departments,
  onTermChange,
  onSearchChange,
  onDepartmentChange,
  onImportComplete
}: CourseFilterPanelProps) => {
  const { user } = useAuth();

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <TermSelector
            selectedTerm={selectedTerm}
            onTermChange={onTermChange}
          />
          
          {user && (
            <ImportCoursesButton
              selectedTerm={selectedTerm}
              onImportComplete={onImportComplete}
            />
          )}
        </div>
        
        <CourseFilters
          searchQuery={searchQuery}
          selectedDepartment={selectedDepartment}
          onSearchChange={onSearchChange}
          onDepartmentChange={onDepartmentChange}
          departments={departments}
        />
      </CardContent>
    </Card>
  );
};

export default CourseFilterPanel;
