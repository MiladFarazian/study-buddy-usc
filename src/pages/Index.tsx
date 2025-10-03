
import Hero from "@/components/home/Hero";
import FeatureCards from "@/components/home/FeatureCards";
import FeaturedTutors from "@/components/home/FeaturedTutors";
import PopularCourses from "@/components/home/PopularCourses";
import AuthSection from "@/components/home/AuthSection";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import TestEmailButton from "@/components/debug/TestEmailButton";

const Index = () => {
  const isMobile = useIsMobile();
  const { isTutor } = useAuth();
  const showDebug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === 'email';
  return (
    <div className={`space-y-4 md:space-y-8 ${isMobile ? 'py-4 px-2' : 'py-6'} max-w-full`}>
      <Hero />
      {showDebug && (
        <div className={isMobile ? "mt-2" : "mt-4"}>
          <TestEmailButton />
        </div>
      )}
      <div className={isMobile ? "mt-4" : "mt-6"}>
        <AuthSection />
      </div>
      <div className={isMobile ? "mt-6" : "mt-12"}>
        <FeatureCards />
      </div>
      {!isTutor && <FeaturedTutors />}
      <PopularCourses />
    </div>
  );
};

export default Index;
