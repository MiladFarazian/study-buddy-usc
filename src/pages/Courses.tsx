
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Course } from "@/integrations/supabase/types-extension";
import TermSelector from "@/components/courses/TermSelector";
import CourseFilters from "@/components/courses/CourseFilters";
import CourseCard from "@/components/courses/CourseCard";
import ImportCoursesButton from "@/components/courses/ImportCoursesButton";
import { useAuth } from "@/contexts/AuthContext";

const Courses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch courses when the selected term changes
  useEffect(() => {
    const fetchCourses = async () => {
      if (!selectedTerm) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from("courses")
          .select("*")
          .eq("term_code", selectedTerm);
        
        if (error) {
          console.error("Error fetching courses:", error);
          return;
        }
        
        setCourses(data as Course[]);
        
        // Extract unique departments
        const uniqueDepartments = [...new Set(data.map(course => course.department))];
        setDepartments(uniqueDepartments.sort());
        
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourses();
  }, [selectedTerm]);
  
  // Filter courses based on search query and selected department
  useEffect(() => {
    let filtered = [...courses];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        course =>
          course.code.toLowerCase().includes(query) ||
          course.name.toLowerCase().includes(query) ||
          (course.description && course.description.toLowerCase().includes(query))
      );
    }
    
    if (selectedDepartment !== "all") {
      filtered = filtered.filter(course => course.department === selectedDepartment);
    }
    
    setFilteredCourses(filtered);
  }, [courses, searchQuery, selectedDepartment]);
  
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
      supabase
        .from("courses")
        .select("*")
        .eq("term_code", selectedTerm)
        .then(({ data, error }) => {
          if (error) {
            console.error("Error refreshing courses:", error);
            return;
          }
          
          setCourses(data as Course[]);
          
          // Update departments
          const uniqueDepartments = [...new Set(data.map(course => course.department))];
          setDepartments(uniqueDepartments.sort());
        });
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
      
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <TermSelector
              selectedTerm={selectedTerm}
              onTermChange={handleTermChange}
            />
            
            {user && (
              <ImportCoursesButton
                selectedTerm={selectedTerm}
                onImportComplete={handleImportComplete}
              />
            )}
          </div>
          
          <CourseFilters
            searchQuery={searchQuery}
            selectedDepartment={selectedDepartment}
            onSearchChange={handleSearchChange}
            onDepartmentChange={handleDepartmentChange}
            departments={departments}
          />
        </CardContent>
      </Card>
      
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
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-usc-cardinal"></div>
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No courses found</h3>
              <p className="text-muted-foreground mb-4">
                {selectedTerm ? "Try adjusting your search or filters" : "Please select a term"}
              </p>
              {user && selectedTerm && (
                <Button onClick={() => handleImportComplete()}>
                  Import USC Courses
                </Button>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="list" className="mt-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-usc-cardinal"></div>
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="divide-y">
              {filteredCourses.map((course) => (
                <div key={course.id} className="py-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{course.code}</h3>
                        <span className="text-sm text-muted-foreground">{course.name}</span>
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
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No courses found</h3>
              <p className="text-muted-foreground mb-4">
                {selectedTerm ? "Try adjusting your search or filters" : "Please select a term"}
              </p>
              {user && selectedTerm && (
                <Button onClick={() => handleImportComplete()}>
                  Import USC Courses
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Courses;
