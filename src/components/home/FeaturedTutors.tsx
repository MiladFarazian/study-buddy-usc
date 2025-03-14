
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
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
  }
];

const FeaturedTutors = () => {
  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Featured Tutors</h2>
        <Button asChild variant="ghost" className="text-usc-cardinal">
          <Link to="/tutors" className="flex items-center">
            View All
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="ml-1 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredTutors.map((tutor) => (
          <TutorCard key={tutor.id} tutor={tutor} />
        ))}
      </div>
    </div>
  );
};

export default FeaturedTutors;
