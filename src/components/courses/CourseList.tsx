
import { Course } from "@/types/CourseTypes";
import CourseCard from "./CourseCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { SearchIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CourseListProps {
  courses: Course[];
  loading: boolean;
  selectedTerm: string;
  courseCount: number;
  onImportCourses?: () => void; // Make this optional
}

const CourseList = ({ courses, loading, selectedTerm, courseCount, onImportCourses }: CourseListProps) => {
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-usc-cardinal"></div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <SearchIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium mb-2">No courses found</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {selectedTerm ? "Try adjusting your search or filters" : "Please select a term to view courses"}
        </p>
        
        {user && selectedTerm && courseCount === 0 && onImportCourses && (
          <Button onClick={onImportCourses} className="mx-auto">
            Import USC Courses
          </Button>
        )}
      </div>
    );
  }

  return (
    <Tabs defaultValue="grid" className="w-full">
      <div className="flex justify-between items-center mb-4">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>
        
        <div className="text-sm text-muted-foreground">
          {courses.length} {courses.length === 1 ? 'course' : 'courses'} found
        </div>
      </div>
      
      <TabsContent value="grid" className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </TabsContent>
      
      <TabsContent value="list" className="mt-4">
        <div className="divide-y border rounded-md">
          {courses.map((course) => (
            <div key={course.id} className="p-4 hover:bg-gray-50">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                    <h3 className="font-medium">{course.course_number}</h3>
                    <span className="text-sm text-muted-foreground">{course.course_title}</span>
                  </div>
                  
                  {course.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {course.description}
                    </p>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    {course.instructor && <span className="mr-3">Instructor: {course.instructor}</span>}
                    {course.units && <span className="mr-3">Units: {course.units}</span>}
                    {course.location && <span>Location: {course.location}</span>}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2 md:mt-0">
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    {course.department}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </TabsContent>
      
      <TabsContent value="table" className="mt-4">
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Number</TableHead>
                <TableHead>Course Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Instructor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.course_number}</TableCell>
                  <TableCell>{course.course_title}</TableCell>
                  <TableCell>{course.department}</TableCell>
                  <TableCell>{course.instructor || "TBD"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default CourseList;
