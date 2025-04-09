
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const Hero = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`w-full bg-white/80 backdrop-blur-md rounded-lg shadow-lg ${isMobile ? 'p-6' : 'p-10'} flex flex-col items-center justify-center text-center`}>
      <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl md:text-5xl'} font-bold mb-4 md:mb-6 bg-gradient-to-r from-usc-cardinal to-usc-gold bg-clip-text text-transparent`}>
        Find Your Perfect Study Buddy at USC
      </h1>
      <p className={`${isMobile ? 'text-base' : 'text-lg md:text-xl'} mb-6 md:mb-8 max-w-3xl text-gray-700`}>
        Connect with qualified tutors, access course resources, and ace your classes. USC's premier
        peer-to-peer tutoring platform.
      </p>
      <div className="flex flex-row gap-4">
        <Button asChild size={isMobile ? "default" : "lg"} className="bg-usc-cardinal hover:bg-usc-cardinal-dark border-none">
          <Link to="/tutors">Find a Tutor</Link>
        </Button>
        <Button asChild size={isMobile ? "default" : "lg"} variant="outline" className="border-usc-gold hover:bg-usc-gold/10 text-gray-800">
          <Link to="/courses">Browse Courses</Link>
        </Button>
      </div>
    </div>
  );
};

export default Hero;
