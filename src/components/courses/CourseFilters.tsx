
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface CourseFiltersProps {
  searchQuery: string;
  selectedDepartment: string;
  departments: Array<{ code: string; name: string }>;
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
  const isMobile = useIsMobile();
  
  return (
    <div className="space-y-3 md:space-y-4">
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-gray-400`} />
        <Input
          type="text"
          placeholder={isMobile ? "Search courses..." : "Search courses by code, name, or description..."}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 w-full"
        />
      </div>
      
      <div className={`flex items-center ${isMobile ? 'flex-col items-start' : 'gap-2'}`}>
        <div className={`flex items-center gap-1 ${isMobile ? 'mb-2' : ''}`}>
          <Filter className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-gray-500`} />
          <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>Filter:</span>
        </div>
        
        <Select
          value={selectedDepartment}
          onValueChange={onDepartmentChange}
        >
          <SelectTrigger className={`${isMobile ? 'w-full text-sm h-8' : 'w-full max-w-xs'}`}>
            <SelectValue placeholder="Select Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.code} value={dept.code}>{dept.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default CourseFilters;
