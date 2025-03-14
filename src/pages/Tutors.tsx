
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter } from "lucide-react";
import TutorCard from "@/components/ui/TutorCard";

const featuredTutors = [
  {
    id: "1",
    name: "Alex Johnson",
    field: "Computer Science",
    rating: 4.9,
    hourlyRate: 25,
    subjects: [
      { code: "CSCI 103", name: "Introduction to Programming" },
      { code: "CSCI 104", name: "Data Structures and Object-Oriented Design" },
      { code: "CSCI 170", name: "Discrete Methods in Computer Science" }
    ],
    imageUrl: "https://randomuser.me/api/portraits/men/32.jpg"
  },
  {
    id: "2",
    name: "Sophia Martinez",
    field: "Biochemistry",
    rating: 4.8,
    hourlyRate: 30,
    subjects: [
      { code: "CHEM 105A", name: "General Chemistry" },
      { code: "CHEM 105B", name: "General Chemistry" },
      { code: "CHEM 300", name: "Analytical Chemistry" }
    ],
    imageUrl: "https://randomuser.me/api/portraits/women/44.jpg"
  },
  {
    id: "3",
    name: "Marcus Williams",
    field: "Economics",
    rating: 4.7,
    hourlyRate: 22,
    subjects: [
      { code: "ECON 203", name: "Principles of Microeconomics" },
      { code: "ECON 205", name: "Principles of Macroeconomics" },
      { code: "ECON 303", name: "Intermediate Microeconomic Theory" }
    ],
    imageUrl: "https://randomuser.me/api/portraits/men/75.jpg"
  },
  {
    id: "4",
    name: "Emily Chen",
    field: "Mathematics",
    rating: 4.9,
    hourlyRate: 28,
    subjects: [
      { code: "MATH 125", name: "Calculus I" },
      { code: "MATH 126", name: "Calculus II" },
      { code: "MATH 225", name: "Linear Algebra and Linear Differential Equations" }
    ],
    imageUrl: "https://randomuser.me/api/portraits/women/33.jpg"
  },
  {
    id: "5",
    name: "James Wilson",
    field: "Physics",
    rating: 4.6,
    hourlyRate: 26,
    subjects: [
      { code: "PHYS 151", name: "Fundamentals of Physics I: Mechanics and Thermodynamics" },
      { code: "PHYS 152", name: "Fundamentals of Physics II: Electricity and Magnetism" },
      { code: "PHYS 153", name: "Fundamentals of Physics III: Optics and Modern Physics" }
    ],
    imageUrl: "https://randomuser.me/api/portraits/men/62.jpg"
  },
  {
    id: "6",
    name: "Olivia Brown",
    field: "Psychology",
    rating: 4.8,
    hourlyRate: 24,
    subjects: [
      { code: "PSYC 100", name: "Introduction to Psychology" },
      { code: "PSYC 274", name: "Statistics I" },
      { code: "PSYC 314", name: "Research Methods" }
    ],
    imageUrl: "https://randomuser.me/api/portraits/women/65.jpg"
  }
];

const Tutors = () => {
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
              <Input placeholder="Search by name or subject..." className="pl-9" />
            </div>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Subject Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                <SelectItem value="cs">Computer Science</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="science">Science</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-4">
              <Button className="bg-usc-cardinal hover:bg-usc-cardinal-dark w-full">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredTutors.map((tutor) => (
          <TutorCard key={tutor.id} tutor={tutor} />
        ))}
      </div>
    </div>
  );
};

export default Tutors;
