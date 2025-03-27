
import Hero from "@/components/home/Hero";
import FeatureCards from "@/components/home/FeatureCards";
import FeaturedTutors from "@/components/home/FeaturedTutors";
import PopularCourses from "@/components/home/PopularCourses";
import AuthSection from "@/components/home/AuthSection";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  const isMobile = useIsMobile();
  const { user, profile } = useAuth();
  
  return (
    <div className="page-container space-y-4 md:space-y-8 max-w-full">
      {/* Hero Section with USC Cardinal Background */}
      <div className="bg-usc-cardinal text-white p-8 md:p-12 rounded-lg animate-fade-in">
        <h1 className="font-playfair text-3xl md:text-5xl font-bold mb-4">
          Find Your Perfect Study Buddy at USC
        </h1>
        <p className="text-lg md:text-xl mb-6 max-w-3xl">
          Connect with qualified tutors, access course resources, and ace your classes.
          USC's premier peer-to-peer tutoring platform.
        </p>
        <div className="flex flex-wrap gap-4">
          <Button asChild className="bg-white text-usc-cardinal hover:bg-gray-100">
            <Link to="/tutors">Find a Tutor</Link>
          </Button>
          <Button asChild variant="outline" className="border-white text-white hover:bg-white/10">
            <Link to="/courses">Browse Courses</Link>
          </Button>
        </div>
      </div>
      
      {/* Welcome Back Section (for logged in users) */}
      {user && profile && (
        <div className="bg-white p-6 rounded-lg border shadow-sm animate-fade-in">
          <h2 className="font-playfair font-bold text-2xl mb-2">
            Welcome back, {profile.first_name}!
          </h2>
          <p className="text-muted-foreground mb-4">
            Continue exploring tutoring opportunities and improve your academic performance.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="default">
              <Link to="/schedule">My Schedule</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/tutors">Find Tutors</Link>
            </Button>
          </div>
        </div>
      )}
      
      {!user && (
        <div className={isMobile ? "mt-4" : "mt-6"}>
          <AuthSection />
        </div>
      )}
      
      <div className={isMobile ? "mt-6" : "mt-12"}>
        <FeatureCards />
      </div>
      
      <div className="space-y-2 animate-fade-in">
        <h2 className="font-playfair font-bold text-2xl">Featured Tutors</h2>
        <FeaturedTutors />
      </div>
      
      <div className="space-y-2 animate-fade-in">
        <h2 className="font-playfair font-bold text-2xl">Popular Courses</h2>
        <PopularCourses />
      </div>
    </div>
  );
};

export default Index;
