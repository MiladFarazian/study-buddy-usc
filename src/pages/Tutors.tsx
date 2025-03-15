
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, Loader2 } from "lucide-react";
import TutorCard from "@/components/ui/TutorCard";
import { useTutors } from "@/hooks/useTutors";
import { Tutor } from "@/types/tutor";

const Tutors = () => {
  const { tutors, loading } = useTutors();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");

  // Filter tutors based on search query and selected subject
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

  const handleSearch = () => {
    // Already filtered in real-time
  };

  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Find Tutors</h1>
          <p className="text-muted-foreground">Connect with top USC tutors for personalized academic support</p>
        </div>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name or subject..." 
                className="pl-9" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
            <div className="flex gap-4">
              <Button 
                className="bg-usc-cardinal hover:bg-usc-cardinal-dark w-full"
                onClick={handleSearch}
              >
                Search
              </Button>
              <Button variant="outline" className="w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal" />
          <span className="ml-2">Loading tutors...</span>
        </div>
      ) : filteredTutors.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">No tutors found matching your criteria.</p>
          <p className="text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutors.map((tutor) => (
            <TutorCard key={tutor.id} tutor={tutor} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Tutors;
