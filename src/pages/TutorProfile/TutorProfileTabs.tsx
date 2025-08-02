
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Tutor, Review } from "@/types/tutor";
import { TutorProfileHeader } from "@/components/tutor/TutorProfileHeader";
import { TutorBioSection } from "@/components/tutor/TutorBioSection";
import { TutorEducationSection } from "@/components/tutor/TutorEducationSection";
import { TutorSubjectsSection } from "@/components/tutor/TutorSubjectsSection";
import { TutorAvailabilitySection } from "@/components/tutor/TutorAvailabilitySection";
import { TutorReviewsSection } from "@/components/tutor/TutorReviewsSection";
import { TutorBadges } from "@/components/TutorBadges";
import { useTutorBadges } from "@/hooks/useTutorBadges";

interface TutorProfileTabsProps {
  tutor: Tutor;
  reviews: Review[];
  refreshReviews: () => void;
  getInitials: (name: string) => string;
  onBookSession: () => void;
}

export const TutorProfileTabs = ({
  tutor,
  reviews,
  refreshReviews,
  getInitials,
  onBookSession
}: TutorProfileTabsProps) => {
  const { earnedBadges, progressData } = useTutorBadges(tutor.id);
  return (
    <Tabs defaultValue="about" className="w-full">
      <TabsList className="w-full grid grid-cols-3 mb-6">
        <TabsTrigger value="about" className="data-[state=active]:bg-usc-cardinal data-[state=active]:text-white">About</TabsTrigger>
        <TabsTrigger value="subjects" className="data-[state=active]:bg-usc-cardinal data-[state=active]:text-white">Subjects</TabsTrigger>
        <TabsTrigger value="availability" className="data-[state=active]:bg-usc-cardinal data-[state=active]:text-white">Availability</TabsTrigger>
      </TabsList>
      
      <Card>
        <CardContent className="p-6">
          <TabsContent value="about" className="mt-0">
            <AboutTabContent tutor={tutor} reviews={reviews} getInitials={getInitials} refreshReviews={refreshReviews} />
          </TabsContent>
          
          <TabsContent value="subjects" className="mt-0">
            <TutorSubjectsSection subjects={tutor.subjects} />
          </TabsContent>
          
          <TabsContent value="availability" className="mt-0">
            <TutorAvailabilitySection tutor={tutor} />
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  );
};

interface AboutTabContentProps {
  tutor: Tutor;
  reviews: Review[];
  getInitials: (name: string) => string;
  refreshReviews: () => void;
}

const AboutTabContent = ({ tutor, reviews, getInitials, refreshReviews }: AboutTabContentProps) => {
  return (
    <div className="space-y-6">
      <div>
        <TutorProfileHeader 
          tutor={tutor} 
          reviewsCount={reviews.length} 
          getInitials={getInitials} 
          showDetails={true}
        />
      </div>
      
      <TutorBioSection bio={tutor.bio} />
      <TutorEducationSection field={tutor.field} graduationYear={tutor.graduationYear} />
      
      {/* Badges Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Achievements</h3>
        <TutorBadges 
          tutorId={tutor.id}
          earnedBadges={earnedBadges}
          progressData={progressData}
          showProgress={true}
        />
      </div>
      
      {/* Reviews Section */}
      <TutorReviewsSection 
        reviews={reviews} 
      />
    </div>
  );
};
