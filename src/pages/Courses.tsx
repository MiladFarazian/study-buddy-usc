
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useCourses } from "@/hooks/useCourses";
import CourseFilters from "@/components/courses/CourseFilters";
import CourseList from "@/components/courses/CourseList";
import TermSelector from "@/components/courses/TermSelector";
import PopularCourses from "@/components/home/PopularCourses";

const Courses = () => {
  const [selectedTerm, setSelectedTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  
  const { 
    courses, 
    allCourses, 
    departments, 
    loading 
  } = useCourses({
    term: selectedTerm,
    search: searchQuery,
    department: selectedDepartment
  });

  const handleTermChange = (termCode: string) => {
    setSelectedTerm(termCode);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleDepartmentChange = (department: string) => {
    setSelectedDepartment(department);
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">USC Courses</h1>
          <p className="text-muted-foreground">Browse and search for courses at USC</p>
        </div>
      </div>
      
      {/* Popular Courses Section */}
      <div className="mb-8">
        <PopularCourses />
      </div>
      
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <TermSelector
              selectedTerm={selectedTerm}
              onTermChange={handleTermChange}
            />
          </div>
          
          <CourseFilters
            searchQuery={searchQuery}
            selectedDepartment={selectedDepartment}
            departments={departments}
            onSearchChange={handleSearchChange}
            onDepartmentChange={handleDepartmentChange}
          />
        </CardContent>
      </Card>
      
      <CourseList
        courses={courses}
        loading={loading}
        selectedTerm={selectedTerm}
        courseCount={allCourses.length}
      />
    </div>
  );
};

export default Courses;
