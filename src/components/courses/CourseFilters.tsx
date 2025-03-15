
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

interface CourseFiltersProps {
  searchQuery: string;
  selectedDepartment: string;
  departments: string[];
  onSearchChange: (query: string) => void;
  onDepartmentChange: (department: string) => void;
}

const CourseFilters = ({
  searchQuery,
  selectedDepartment,
  departments,
  onSearchChange,
  onDepartmentChange
}: CourseFiltersProps) => {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search courses by code, name, or description..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 w-full"
        />
      </div>
      
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium">Filter:</span>
        
        <Select
          value={selectedDepartment}
          onValueChange={onDepartmentChange}
        >
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="Select Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default CourseFilters;
