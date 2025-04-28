
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import TutorCard from "@/components/ui/TutorCard";
import { useTutors } from "@/hooks/useTutors";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const FeaturedTutors = () => {
  const tutorsData = useTutors();
  const { tutors, loading } = tutorsData;
  const isMobile = useIsMobile();
  const [cardsPerView, setCardsPerView] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setCardsPerView(1);
      } else if (width < 1024) {
        setCardsPerView(2);
      } else {
        setCardsPerView(3);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const featuredTutors = [...tutors]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6);

  return (
    <div className="mt-8 md:mt-12 container px-4 md:px-6 relative">
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
        <Carousel
          opts={{
            align: "start",
            slidesToScroll: 1,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-6">
            {featuredTutors.map((tutor) => (
              <CarouselItem 
                key={tutor.id} 
                className={`${
                  isMobile 
                    ? 'basis-[90%]' 
                    : cardsPerView === 2 
                      ? 'basis-[45%]' 
                      : 'basis-[30%]'
                } pl-6`}
              >
                <TutorCard tutor={tutor} />
              </CarouselItem>
            ))}
          </CarouselContent>
          {featuredTutors.length > (isMobile ? 1 : cardsPerView) && (
            <>
              <CarouselPrevious className="hidden md:flex -left-12 bg-white" />
              <CarouselNext className="hidden md:flex -right-12 bg-white" />
            </>
          )}
        </Carousel>
      )}
    </div>
  );
};

export default FeaturedTutors;
