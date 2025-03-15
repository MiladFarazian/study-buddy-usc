
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search,
  Download,
  Filter,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Term } from "@/integrations/supabase/types-extension";

type Course = {
  id: string;
  code: string;
  name: string;
  department: string;
  description: string | null;
  instructor?: string | null;
  term_code?: string | null;
};

type FilterOptions = {
  department: string;
  searchQuery: string;
};

const Courses = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [importingCourses, setImportingCourses] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  const form = useForm({
    defaultValues: {
      department: "all",
      searchQuery: "",
    },
  });

  // Load terms when component mounts
  useEffect(() => {
    async function fetchTerms() {
      try {
        // Use the raw SQL query to work around the type issue until types are updated
        const { data, error } = await supabase
          .from('terms')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          throw error;
        }

        if (data) {
          setTerms(data as Term[]);
          // Set default selected term to the current one
          const currentTerm = data.find(term => (term as Term).is_current);
          if (currentTerm) {
            setSelectedTerm((currentTerm as Term).code);
          } else if (data.length > 0) {
            setSelectedTerm((data[0] as Term).code);
          }
        }
      } catch (error) {
        console.error("Error fetching terms:", error);
        toast({
          title: "Error",
          description: "Failed to load terms",
          variant: "destructive",
        });
      }
    }

    fetchTerms();
  }, [toast]);

  // Fetch courses when selectedTerm changes
  useEffect(() => {
    if (selectedTerm) {
      fetchCourses(selectedTerm);
    }
  }, [selectedTerm]);

  // Filter courses when searchQuery or selectedDepartment changes
  useEffect(() => {
    filterCourses();
  }, [searchQuery, selectedDepartment, courses]);

  async function fetchCourses(termCode: string) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("term_code", termCode)
        .order("code", { ascending: true });

      if (error) {
        throw error;
      }

      if (data) {
        setCourses(data);
        
        // Extract unique departments
        const uniqueDepartments = [...new Set(data.map(course => course.department))].sort();
        setDepartments(uniqueDepartments);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function filterCourses() {
    let filtered = [...courses];

    // Filter by department
    if (selectedDepartment !== "all") {
      filtered = filtered.filter(course => course.department === selectedDepartment);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        course => 
          course.code.toLowerCase().includes(query) || 
          course.name.toLowerCase().includes(query) || 
          (course.description && course.description.toLowerCase().includes(query))
      );
    }

    setFilteredCourses(filtered);
  }

  async function importUSCCourses() {
    if (!selectedTerm) {
      toast({
        title: "Error",
        description: "Please select a term first",
        variant: "destructive",
      });
      return;
    }

    setImportingCourses(true);
    try {
      const response = await fetch(
        `${window.location.origin}/functions/v1/fetch-usc-courses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ term: selectedTerm }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to import USC courses");
      }

      toast({
        title: "Success",
        description: result.message,
      });

      // Refresh courses
      fetchCourses(selectedTerm);
    } catch (error) {
      console.error("Error importing USC courses:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to import USC courses",
        variant: "destructive",
      });
    } finally {
      setImportingCourses(false);
    }
  }

  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">USC Courses</h1>
          <p className="text-muted-foreground">Browse and explore courses from all USC departments</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Term" />
            </SelectTrigger>
            <SelectContent>
              {terms.map((term) => (
                <SelectItem key={term.id} value={term.code}>
                  {term.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {user && (
            <Button 
              className="bg-usc-cardinal hover:bg-usc-cardinal-dark" 
              onClick={importUSCCourses}
              disabled={importingCourses}
            >
              {importingCourses ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Import Courses
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-1/4">
            <label htmlFor="department-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger id="department-filter">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-2/4">
            <label htmlFor="search-courses" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                id="search-courses"
                placeholder="Search courses..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : filteredCourses.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Courses ({filteredCourses.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.slice(0, 50).map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.code}</TableCell>
                    <TableCell>{course.name}</TableCell>
                    <TableCell>{course.department}</TableCell>
                    <TableCell className="hidden md:table-cell max-w-md truncate">
                      {course.description || "No description available"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredCourses.length > 50 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Showing 50 of {filteredCourses.length} courses. Refine your search to see more specific results.
              </div>
            )}
          </CardContent>
        </Card>
      ) : courses.length > 0 ? (
        <div className="text-center py-12">
          <Filter className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium mb-1">No matching courses</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter to find what you're looking for.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">No Courses Available</h2>
          <p className="text-gray-500 mb-4">
            {user ? (
              <>
                There are no courses available for this term. Click the "Import Courses" button to fetch the latest USC course data.
              </>
            ) : (
              <>
                There are no courses available for this term. Please sign in to import course data.
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default Courses;
