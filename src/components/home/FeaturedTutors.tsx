
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import TutorCard from "@/components/ui/TutorCard";
import { useTutors } from "@/hooks/useTutors";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const FeaturedTutors = () => {
  const { tutors, loading } = useTutors();
  const isMobile = useIsMobile();
  
  console.log("FeaturedTutors - Number of tutors:", tutors.length);
  
  // Show only the top 3 tutors based on rating
  // For mobile, only show top 2
  const featuredTutors = [...tutors]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, isMobile ? 2 : 3);

  console.log("FeaturedTutors - Featured tutors:", featuredTutors.length);

  return (
    <div className="mt-8 md:mt-12 container px-0">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>Featured Tutors</h2>
        <Button asChild variant="ghost" className="text-usc-cardinal">
          <Link to="/tutors" className="flex items-center text-sm md:text-base">
            View All
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="ml-1 h-3 w-3 md:h-4 md:w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8 md:py-12">
          <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin text-usc-cardinal" />
          <span className="ml-2 text-sm md:text-base">Loading featured tutors...</span>
        </div>
      ) : featuredTutors.length === 0 ? (
        <div className="text-center py-8 md:py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No featured tutors available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {featuredTutors.map((tutor) => (
            <TutorCard key={tutor.id} tutor={tutor} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FeaturedTutors;
