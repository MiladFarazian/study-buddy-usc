
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import TutorCard from "@/components/ui/TutorCard";
import { useTutors } from "@/hooks/useTutors";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const FeaturedTutors = () => {
  const { tutors, loading } = useTutors();
  const isMobile = useIsMobile();
  
  // Show only the top 3 tutors based on rating
  // For mobile, only show top 2
  const featuredTutors = [...tutors]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, isMobile ? 2 : 3);

  return (
    <div className="mt-8 md:mt-12 max-w-full overflow-hidden">
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
      ) : (
        <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'}`}>
          {featuredTutors.map((tutor) => (
            <TutorCard key={tutor.id} tutor={tutor} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FeaturedTutors;
