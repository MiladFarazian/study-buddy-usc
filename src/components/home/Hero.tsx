
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const Hero = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`w-full bg-usc-cardinal text-white rounded-lg ${isMobile ? 'p-6' : 'p-10'} flex flex-col items-center justify-center text-center`}>
      <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl md:text-5xl'} font-bold mb-4 md:mb-6`}>
        Find Your Perfect Study Buddy at USC
      </h1>
      <p className={`${isMobile ? 'text-base' : 'text-lg md:text-xl'} mb-6 md:mb-8 max-w-3xl`}>
        Connect with qualified tutors, access course resources, and ace your classes. USC's premier
        peer-to-peer tutoring platform.
      </p>
      <div className="flex flex-row gap-4">
        <Button asChild size={isMobile ? "default" : "lg"} className="bg-white text-usc-cardinal hover:bg-gray-100 border-none">
          <Link to="/tutors">Find a Tutor</Link>
        </Button>
        <Button asChild size={isMobile ? "default" : "lg"} className="bg-white text-usc-cardinal hover:bg-gray-100 border-none">
          <Link to="/courses">Browse Courses</Link>
        </Button>
      </div>
    </div>
  );
};

export default Hero;
