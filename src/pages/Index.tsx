
import Hero from "@/components/home/Hero";
import FeatureCards from "@/components/home/FeatureCards";
import FeaturedTutors from "@/components/home/FeaturedTutors";
import PopularCourses from "@/components/home/PopularCourses";
import AuthSection from "@/components/home/AuthSection";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`space-y-4 md:space-y-8 ${isMobile ? 'py-4' : 'py-6'}`}>
      <Hero />
      <div className={isMobile ? "mt-4" : "mt-6"}>
        <AuthSection />
      </div>
      <div className={isMobile ? "mt-6" : "mt-12"}>
        <FeatureCards />
      </div>
      <FeaturedTutors />
      <PopularCourses />
    </div>
  );
};

export default Index;
