
import { usePopularCourses } from "@/hooks/usePopularCourses";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import CourseCard from "@/components/courses/CourseCard";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";

const PopularCourses = () => {
  // Fetch top 20 popular courses
  const { courses, loading } = usePopularCourses(20);
  
  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Popular Courses</h2>
        <Button asChild variant="ghost" className="text-usc-cardinal">
          <Link to="/courses" className="flex items-center">
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

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-usc-cardinal" />
          <span className="ml-2">Loading popular courses...</span>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No popular courses found. Start adding courses to your profile!</p>
        </div>
      ) : (
        <Carousel className="w-full">
          <CarouselContent className="-ml-4">
            {courses.map((course) => (
              <CarouselItem key={course.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <CourseCard course={course} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-0" />
          <CarouselNext className="right-0" />
        </Carousel>
      )}
    </div>
  );
};

export default PopularCourses;
