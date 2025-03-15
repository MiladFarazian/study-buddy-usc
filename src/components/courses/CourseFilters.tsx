
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CourseFiltersProps {
  searchQuery: string;
  selectedDepartment: string;
  onSearchChange: (query: string) => void;
  onDepartmentChange: (department: string) => void;
  departments: string[];
}

const CourseFilters = ({
  searchQuery,
  selectedDepartment,
  onSearchChange,
  onDepartmentChange,
  departments
}: CourseFiltersProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full"
        />
      </div>
      
      <Select
        value={selectedDepartment}
        onValueChange={onDepartmentChange}
      >
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Department" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Departments</SelectItem>
          {departments.map((dept) => (
            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CourseFilters;
