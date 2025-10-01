
import { useState, useEffect } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import { getTutorStudentCourses, getMutualCourses } from "@/lib/tutor-student-utils";

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
  const { profile, user } = useAuth();
  const [studentCourses, setStudentCourses] = useState<string[]>([]);
  const [mutualCourses, setMutualCourses] = useState<string[]>([]);

  // Fetch student courses for highlighting
  useEffect(() => {
    const fetchStudentCourses = async () => {
      if (!profile) {
        setStudentCourses([]);
        return;
      }
      
      if (profile.student_courses && Array.isArray(profile.student_courses)) {
        setStudentCourses(profile.student_courses);
      } else if (profile.role === 'tutor' && user) {
        try {
          const tutorStudentCourses = await getTutorStudentCourses(user.id);
          setStudentCourses(tutorStudentCourses.map((course: any) => course.course_number));
        } catch (err) {
          console.error("Error fetching tutor student courses:", err);
          setStudentCourses([]);
        }
      } else {
        setStudentCourses([]);
      }
    };

    fetchStudentCourses();
  }, [profile, user]);

  // Fetch mutual courses
  useEffect(() => {
    const fetchMutualCourses = async () => {
      if (!studentCourses.length) {
        setMutualCourses([]);
        return;
      }

      const mutual = await getMutualCourses(studentCourses, tutor.id);
      setMutualCourses(mutual);
    };

    fetchMutualCourses();
  }, [studentCourses, tutor.id]);

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
            <TutorSubjectsSection 
              subjects={tutor.subjects} 
              highlightedCourses={studentCourses}
              mutualCourses={mutualCourses}
            />
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
  const { earnedBadges, progressData } = useTutorBadges(tutor.id);
  
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
      
      {/* Badges Section - Only show earned badges for student view */}
      {earnedBadges.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Achievements</h3>
          <TutorBadges 
            tutorId={tutor.id}
            earnedBadges={earnedBadges}
            progressData={progressData}
            showProgress={false}
            showOnlyEarned={true}
          />
        </div>
      )}
      
      {/* Reviews Section */}
      <TutorReviewsSection 
        reviews={reviews} 
      />
    </div>
  );
};
