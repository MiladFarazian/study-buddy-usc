
import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Course } from "@/integrations/supabase/types-extension";
import { useCoursesFilter } from "@/hooks/useCoursesFilter";
import CourseFilterPanel from "@/components/courses/CourseFilterPanel";
import CourseGridView from "@/components/courses/CourseGridView";
import CourseListView from "@/components/courses/CourseListView";

const Courses = () => {
  // Initialize state with explicit type annotations
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Use custom hook for filtering with our strictly-typed state
  const { filteredCourses, departments } = useCoursesFilter(
    courses,
    searchQuery,
    selectedDepartment
  );

  // Define a fetchCourses function to avoid type issues with inline async function
  const fetchCourses = useCallback(async (termCode: string) => {
    if (!termCode) return;
    
    try {
      setLoading(true);
      
      // Fetch courses from Supabase
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("term_code", termCode);
      
      if (error) {
        console.error("Error fetching courses:", error);
        setCourses([]);
        return;
      }
      
      // Handle the response data safely
      if (data && Array.isArray(data)) {
        // Explicitly cast data to Course[] to avoid deep type inference
        const coursesData = data as unknown as Course[];
        setCourses(coursesData);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error("Error:", error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Fetch courses when the selected term changes
  useEffect(() => {
    if (selectedTerm) {
      fetchCourses(selectedTerm);
    }
  }, [selectedTerm, fetchCourses]);
  
  // Event handlers
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };
  
  const handleDepartmentChange = (department: string) => {
    setSelectedDepartment(department);
  };
  
  const handleTermChange = (termCode: string) => {
    setSelectedTerm(termCode);
  };
  
  const handleImportComplete = () => {
    if (selectedTerm) {
      fetchCourses(selectedTerm);
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
