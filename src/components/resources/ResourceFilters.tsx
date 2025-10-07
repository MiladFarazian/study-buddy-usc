import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useCourses } from "@/hooks/useCourses";

interface ResourceFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  courseFilter: string;
  onCourseFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
}

const RESOURCE_TYPES = [
  { value: "all", label: "All Types" },
  { value: "notes", label: "Notes" },
  { value: "practice_exam", label: "Practice Exams" },
  { value: "study_guide", label: "Study Guides" },
  { value: "slides", label: "Slides" },
  { value: "summary", label: "Summaries" },
  { value: "other", label: "Other" },
];

export function ResourceFilters({
  search,
  onSearchChange,
  courseFilter,
  onCourseFilterChange,
  typeFilter,
  onTypeFilterChange,
}: ResourceFiltersProps) {
  const { courses } = useCourses({ term: "20251", search: "", department: "all" });

  // Get unique departments from courses
  const departments = Array.from(new Set(courses.map((c) => c.department).filter(Boolean)));

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search resources..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Course Filter */}
      <Select value={courseFilter} onValueChange={onCourseFilterChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="All Courses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Courses</SelectItem>
          {departments.map((dept) => (
            <SelectItem key={dept} value={dept!}>
              {dept}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Type Filter */}
      <Select value={typeFilter} onValueChange={onTypeFilterChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          {RESOURCE_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
