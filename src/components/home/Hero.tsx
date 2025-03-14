
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <div className="w-full bg-usc-cardinal text-white rounded-lg p-10 flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl md:text-5xl font-bold mb-6">
        Find Your Perfect Study Buddy at USC
      </h1>
      <p className="text-lg md:text-xl mb-8 max-w-3xl">
        Connect with qualified tutors, access course resources, and ace your classes. USC's premier
        peer-to-peer tutoring platform.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg" className="bg-white text-usc-cardinal hover:bg-gray-100">
          <Link to="/tutors">Find a Tutor</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-usc-cardinal-dark">
          <Link to="/courses">Browse Courses</Link>
        </Button>
      </div>
    </div>
  );
};

export default Hero;
