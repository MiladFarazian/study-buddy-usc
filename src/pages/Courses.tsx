
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Course } from "@/integrations/supabase/types-extension";
import { useCoursesFilter } from "@/hooks/useCoursesFilter";
import CourseFilterPanel from "@/components/courses/CourseFilterPanel";
import CourseGridView from "@/components/courses/CourseGridView";
import CourseListView from "@/components/courses/CourseListView";

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Use the custom hook for filtering
  const { filteredCourses, departments } = useCoursesFilter(
    courses,
    searchQuery,
    selectedDepartment
  );

  // Fetch courses when the selected term changes
  useEffect(() => {
    const fetchCourses = async () => {
      if (!selectedTerm) return;
      
      try {
        setLoading(true);
        
        // Use a more direct approach with explicit type casting to avoid deep type instantiation
        const { data, error } = await supabase
          .from("courses")
          .select("*")
          .eq("term_code", selectedTerm);
        
        if (error) {
          console.error("Error fetching courses:", error);
          return;
        }
        
        // Explicitly cast the data to Course[] to avoid type instantiation issues
        setCourses(data as Course[] || []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourses();
  }, [selectedTerm]);
  
  // Handle search input change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };
  
  // Handle department selection change
  const handleDepartmentChange = (department: string) => {
    setSelectedDepartment(department);
  };
  
  // Handle term selection change
  const handleTermChange = (termCode: string) => {
    setSelectedTerm(termCode);
  };
  
  // Handle course import completion
  const handleImportComplete = () => {
    // Refresh courses list
    if (selectedTerm) {
      // Use a more direct approach to avoid type issues
      const fetchUpdatedCourses = async () => {
        const { data, error } = await supabase
          .from("courses")
          .select("*")
          .eq("term_code", selectedTerm);
        
        if (error) {
          console.error("Error refreshing courses:", error);
          return;
        }
        
        // Explicitly cast the data to Course[] to avoid type instantiation issues
        setCourses(data as Course[] || []);
      };
      
      fetchUpdatedCourses();
    }
  };
  
  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">USC Courses</h1>
          <p className="text-muted-foreground">Browse and search for courses at USC</p>
        </div>
      </div>
      
      <CourseFilterPanel
        selectedTerm={selectedTerm}
        searchQuery={searchQuery}
        selectedDepartment={selectedDepartment}
        departments={departments}
        onTermChange={handleTermChange}
        onSearchChange={handleSearchChange}
        onDepartmentChange={handleDepartmentChange}
        onImportComplete={handleImportComplete}
      />
      
      <Tabs defaultValue="grid" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
          
          <div className="text-sm text-muted-foreground">
            {filteredCourses.length} courses found
          </div>
        </div>
        
        <TabsContent value="grid" className="mt-0">
          <CourseGridView
            courses={filteredCourses}
            loading={loading}
            selectedTerm={selectedTerm}
            onImportComplete={handleImportComplete}
          />
        </TabsContent>
        
        <TabsContent value="list" className="mt-0">
          <CourseListView
            courses={filteredCourses}
            loading={loading}
            selectedTerm={selectedTerm}
            onImportComplete={handleImportComplete}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Courses;
