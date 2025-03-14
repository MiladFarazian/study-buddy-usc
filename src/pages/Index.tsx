
import Hero from "@/components/home/Hero";
import FeatureCards from "@/components/home/FeatureCards";
import FeaturedTutors from "@/components/home/FeaturedTutors";

const Index = () => {
  return (
    <div className="space-y-8 py-6">
      <Hero />
      <div className="mt-12">
        <FeatureCards />
      </div>
      <FeaturedTutors />
    </div>
  );
};

export default Index;
