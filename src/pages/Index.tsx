
import Hero from "@/components/home/Hero";
import FeatureCards from "@/components/home/FeatureCards";
import FeaturedTutors from "@/components/home/FeaturedTutors";
import PopularCourses from "@/components/home/PopularCourses";
import AuthSection from "@/components/home/AuthSection";

const Index = () => {
  return (
    <div className="space-y-12 py-6">
      <Hero />
      <div className="mt-6">
        <AuthSection />
      </div>
      <div className="mt-12">
        <FeatureCards />
      </div>
      <FeaturedTutors />
      <PopularCourses />
    </div>
  );
};

export default Index;
