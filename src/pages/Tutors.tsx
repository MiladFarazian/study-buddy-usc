import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, Loader2, X, ChevronLeft, ChevronRight } from "lucide-react";
import TutorCard from "@/components/ui/TutorCard";
import { useTutors } from "@/hooks/useTutors";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getTutorStudentCourses } from "@/lib/tutor-student-utils";

const Tutors = () => {
  const { tutors, loading, studentCourseTutors, loadingStudentTutors } = useTutors();
  const [studentCourses, setStudentCourses] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showOnlyForMyCourses, setShowOnlyForMyCourses] = useState(false);
  const isMobile = useIsMobile();
  const { profile, user } = useAuth();

  // Effect to populate student courses
  useEffect(() => {
    const fetchStudentCourses = async () => {
      if (!profile) {
        setStudentCourses([]);
        return;
      }
      
      if (profile.role === 'student' && profile.student_courses && Array.isArray(profile.student_courses)) {
        setStudentCourses(profile.student_courses);
      } else if (profile.role === 'tutor' && user) {
        try {
          const tutorStudentCourses = await getTutorStudentCourses(user.id);
          setStudentCourses(tutorStudentCourses.map((course: any) => course.course_number));
        } catch (err) {
          console.error("Error fetching tutor student courses:", err);
          setStudentCourses([]);
        }
      } else {
        setStudentCourses([]);
      }
    };

    fetchStudentCourses();
  }, [profile, user]);

  // Check if user is logged in and is a student or tutor
  const isLoggedIn = profile !== null;
  const isStudent = profile && profile.role === 'student';
  const isTutor = profile && profile.role === 'tutor';
  
  // Determine if user has courses based on their role
  const hasStudentCourses = isLoggedIn && studentCourses.length > 0;
  
  // Check if there are matching tutors
  const hasMatchingTutors = studentCourseTutors && studentCourseTutors.length > 0;

  const filteredTutors = (showOnlyForMyCourses && hasMatchingTutors ? studentCourseTutors : tutors).filter((tutor) => {
    const matchesSearch = searchQuery === "" || 
      tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutor.field.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutor.subjects.some(subject => 
        subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesSubject = selectedSubject === "all" || 
      tutor.field.toLowerCase().includes(selectedSubject.toLowerCase()) ||
      tutor.subjects.some(subject => 
        subject.code.toLowerCase().includes(selectedSubject.toLowerCase())
      );
    
    return matchesSearch && matchesSubject;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSubject("all");
  };

  // Horizontal scroll controls for student course tutors section
  const scrollLeft = () => {
    const container = document.getElementById('student-tutors-scroll-container');
    if (container) {
      container.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const container = document.getElementById('student-tutors-scroll-container');
    if (container) {
      container.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const renderFilterSection = () => (
    <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-3 gap-4 md:gap-6'}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search by name or subject..." 
          className="pl-9" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>
      
      <Select 
        value={selectedSubject} 
        onValueChange={setSelectedSubject}
      >
        <SelectTrigger>
          <SelectValue placeholder="Subject Area" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Subjects</SelectItem>
          <SelectItem value="computer science">Computer Science</SelectItem>
          <SelectItem value="mathematics">Mathematics</SelectItem>
          <SelectItem value="physics">Physics</SelectItem>
          <SelectItem value="chemistry">Chemistry</SelectItem>
          <SelectItem value="biology">Biology</SelectItem>
          <SelectItem value="engineering">Engineering</SelectItem>
          <SelectItem value="economics">Economics</SelectItem>
          <SelectItem value="business">Business</SelectItem>
        </SelectContent>
      </Select>
      
      <div className="flex gap-2 md:gap-4">
        {(searchQuery || selectedSubject !== "all") && (
          <Button 
            variant="outline" 
            className="w-auto"
            onClick={clearFilters}
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
        <Button 
          className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white flex-1"
        >
          Search
        </Button>
      </div>
    </div>
  );

  const renderStudentCourseTutorsSection = () => {
    if (!isLoggedIn || (loadingStudentTutors && !hasMatchingTutors)) {
      return null;
    }

    // Get the appropriate title based on user role
    const sectionTitle = isTutor 
      ? "Tutors for Your Learning Needs" 
      : "Tutors for Your Courses";

    // Get appropriate empty state message based on user role
    const noCoursesMessage = isTutor
      ? "No courses added to 'Courses I Need Help With'. Add courses to see matched tutors."
      : "No courses found in your profile. Add courses to see matched tutors.";
    
    const noTutorsMessage = isTutor
      ? "No tutors found for courses you need help with. Explore all available tutors below."
      : "No tutors found for your courses. Explore all available tutors below.";

    if (!hasStudentCourses) {
      return (
        <div className="mt-6 mb-8">
          <h2 className="text-lg md:text-xl font-semibold mb-3">{sectionTitle}</h2>
          <Card className="bg-slate-50">
            <CardContent className="p-4 md:p-6 text-center">
              <p className="text-sm md:text-base text-muted-foreground">
                {noCoursesMessage}
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (!hasMatchingTutors) {
      return (
        <div className="mt-6 mb-8">
          <h2 className="text-lg md:text-xl font-semibold mb-3">{sectionTitle}</h2>
          <Card className="bg-slate-50">
            <CardContent className="p-4 md:p-6 text-center">
              <p className="text-sm md:text-base text-muted-foreground">
                {noTutorsMessage}
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    const displayTutors = studentCourseTutors.slice(0, 10);

    return (
      <div className="mt-6 mb-8 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg md:text-xl font-semibold">{sectionTitle}</h2>
          <Button 
            variant="ghost" 
            className="text-usc-cardinal"
            onClick={() => setShowOnlyForMyCourses(true)}
          >
            View All
          </Button>
        </div>
        
        <div className="relative">
          {displayTutors.length > 3 && (
            <>
              <Button 
                variant="outline" 
                size="icon" 
                className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-md rounded-full h-8 w-8 md:h-10 md:w-10"
                onClick={scrollLeft}
              >
                <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-md rounded-full h-8 w-8 md:h-10 md:w-10"
                onClick={scrollRight}
              >
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </>
          )}
          
          <ScrollArea className="w-full">
            <div 
              id="student-tutors-scroll-container"
              className="flex space-x-4 py-2 px-1 overflow-x-auto hide-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {displayTutors.map((tutor) => (
                <div key={tutor.id} className="flex-shrink-0 w-[280px] md:w-[320px]">
                  <TutorCard tutor={tutor} highlightedCourses={studentCourses} />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  };

  return (
    <div className="py-4 md:py-6 px-4 md:px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 mb-4 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Find Tutors</h1>
          <p className="text-sm md:text-base text-muted-foreground">Connect with top USC tutors for personalized academic support</p>
        </div>
      </div>

      {isMobile ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search..." 
                className="pl-9" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
            <Button 
              variant="outline" 
              className="ml-2 px-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          
          {showFilters && (
            <Card className="mb-4">
              <CardContent className="p-3">
                {renderFilterSection()}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card className="mb-6">
          <CardContent className="p-6">
            {renderFilterSection()}
          </CardContent>
        </Card>
      )}

      {/* Personalized tutors section for student/tutor courses */}
      {renderStudentCourseTutorsSection()}

      {/* Show filter toggle if matching tutors exist */}
      {hasMatchingTutors && (
        <div className="flex items-center justify-end space-x-2 mb-4">
          <span className="text-sm text-gray-600">Show all tutors</span>
          <Switch 
            checked={showOnlyForMyCourses}
            onCheckedChange={setShowOnlyForMyCourses}
          />
          <span className="text-sm text-gray-600">
            {isTutor ? "Show for my learning needs" : "Show for my courses"}
          </span>
        </div>
      )}

      {/* Main separator between sections */}
      {hasMatchingTutors && (
        <Separator className="my-6" />
      )}

      {/* Main tutors section heading */}
      <h2 className="text-xl font-semibold mb-4">
        {showOnlyForMyCourses && hasMatchingTutors ? 
          (isTutor ? "Tutors for Your Learning Needs" : "Tutors for Your Courses") 
          : "All Tutors"}
      </h2>

      {loading ? (
        <div className="flex justify-center items-center py-8 md:py-12">
          <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-usc-cardinal" />
          <span className="ml-2 text-sm md:text-base">Loading tutors...</span>
        </div>
      ) : filteredTutors.length === 0 ? (
        <div className="text-center py-8 md:py-12">
          <p className="text-base md:text-lg text-muted-foreground">No tutors found matching your criteria.</p>
          <p className="text-sm md:text-base text-muted-foreground">Try adjusting your search or filters.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={clearFilters}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 transition-all duration-300">
          {filteredTutors.map((tutor) => (
            <div key={tutor.id} className="w-full">
              <TutorCard 
                tutor={tutor} 
                highlightedCourses={showOnlyForMyCourses && hasMatchingTutors ? studentCourses : undefined} 
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tutors;
