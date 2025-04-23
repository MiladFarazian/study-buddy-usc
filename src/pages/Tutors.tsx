import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, Loader2, X } from "lucide-react";
import TutorCard from "@/components/ui/TutorCard";
import { useTutors } from "@/hooks/useTutors";
import { Tutor } from "@/types/tutor";
import { useIsMobile } from "@/hooks/use-mobile";

const Tutors = () => {
  const { tutors, loading } = useTutors();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const isMobile = useIsMobile();

  const filteredTutors = tutors.filter((tutor) => {
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
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredTutors.map((tutor) => (
            <TutorCard key={tutor.id} tutor={tutor} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Tutors;
