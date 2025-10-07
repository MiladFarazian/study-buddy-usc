import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const BATCH_SIZE = 50;

  // Fetch departments in batches
  useEffect(() => {
    fetchInitialDepartments();
  }, []);

  const fetchInitialDepartments = async () => {
    setLoading(true);
    try {
      const { data: courses, error } = await supabase
        .from("courses-20251")
        .select("Course number")
        .limit(1000); // Get enough to extract departments

      if (error) throw error;

      // Extract unique departments from course numbers
      const deptSet = new Set<string>();
      courses?.forEach((course) => {
        const courseNumber = course["Course number"];
        if (courseNumber) {
          // Extract department code (e.g., "CSCI" from "CSCI-201")
          const match = courseNumber.match(/^([A-Z]+)/);
          if (match) {
            deptSet.add(match[1]);
          }
        }
      });

      const sortedDepts = Array.from(deptSet).sort();
      setDepartments(sortedDepts.slice(0, BATCH_SIZE));
      setHasMore(sortedDepts.length > BATCH_SIZE);
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreDepartments = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      // Fetch more departments (this is a simplified version)
      // In a real scenario, you'd paginate the course data
      const { data: courses, error } = await supabase
        .from("courses-20251")
        .select("Course number")
        .range(departments.length * 20, (departments.length + 1) * 20 + 1000);

      if (error) throw error;

      const deptSet = new Set(departments);
      courses?.forEach((course) => {
        const courseNumber = course["Course number"];
        if (courseNumber) {
          const match = courseNumber.match(/^([A-Z]+)/);
          if (match) {
            deptSet.add(match[1]);
          }
        }
      });

      const sortedDepts = Array.from(deptSet).sort();
      const newDepts = sortedDepts.slice(departments.length, departments.length + BATCH_SIZE);
      
      if (newDepts.length === 0) {
        setHasMore(false);
      } else {
        setDepartments([...departments, ...newDepts]);
      }
    } catch (error) {
      console.error("Error loading more departments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isNearBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    
    if (isNearBottom && hasMore && !loading) {
      loadMoreDepartments();
    }
  };

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
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="max-h-[300px] overflow-y-auto"
          >
            <SelectItem value="all">All Courses</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
            {loading && (
              <div className="flex justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
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
