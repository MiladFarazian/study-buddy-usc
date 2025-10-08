
import Hero from "@/components/home/Hero";
import FeatureCards from "@/components/home/FeatureCards";
import FeaturedTutors from "@/components/home/FeaturedTutors";
import PopularCourses from "@/components/home/PopularCourses";
import AuthSection from "@/components/home/AuthSection";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, FileText, Lock } from "lucide-react";
import TestEmailButton from "@/components/debug/TestEmailButton";

const Index = () => {
  const isMobile = useIsMobile();
  const { isTutor, user, profile } = useAuth();
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
      
      {/* Locked Feature Teasers */}
      {user && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {(profile?.referral_count || 0) < 1 && (
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-50" />
              <CardContent className="relative p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <BarChart className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">
                      Analytics Dashboard
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Track your study progress, session history, and performance metrics
                    </p>
                    <Badge variant="outline" className="gap-1">
                      <Lock className="h-3 w-3" />
                      Requires 1 referral
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {(profile?.referral_count || 0) < 1 && (
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-teal-50 opacity-50" />
              <CardContent className="relative p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">
                      Resources Library
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Access study guides, practice exams, and course materials
                    </p>
                    <Badge variant="outline" className="gap-1">
                      <Lock className="h-3 w-3" />
                      Requires 1 referral
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default Index;
