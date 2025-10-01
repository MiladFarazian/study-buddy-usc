
import { useState, useEffect, useMemo } from "react";
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
import { getTutorStudentCourses } from "@/lib/tutor-student-utils";
import { useTutorMatches } from "@/hooks/useTutorMatches";
import { getCourseMatchType } from "@/lib/instructor-matching-utils";
import { supabase } from "@/integrations/supabase/client";

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
  const { getMatchForTutor } = useTutorMatches();
  const [studentCoursesData, setStudentCoursesData] = useState<Array<{ course_number: string; instructor?: string }>>([]);

  // Fetch student courses with instructor information
  useEffect(() => {
    const fetchStudentCourses = async () => {
      if (!user?.id) {
        setStudentCoursesData([]);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('student_courses')
          .select('course_number, instructor')
          .eq('student_id', user.id);
        
        if (error) throw error;
        setStudentCoursesData(data || []);
      } catch (err) {
        console.error("Error fetching student courses:", err);
        setStudentCoursesData([]);
      }
    };

    fetchStudentCourses();
  }, [user?.id]);

  // Build match map for each course
  const matchByCourse = useMemo(() => {
    const map: Record<string, 'exact' | 'course-only' | 'none'> = {};
    
    tutor.subjects.forEach(subject => {
      const matchType = getCourseMatchType(
        subject.code,
        studentCoursesData.map(c => ({ 
          course_number: c.course_number, 
          course_title: c.course_number, 
          instructor: c.instructor,
          department: c.course_number.split('-')[0]
        })),
        tutor.subjects.map(s => ({
          course_number: s.code,
          course_title: s.name,
          instructor: s.instructor,
          department: s.code.split('-')[0]
        }))
      );
      map[subject.code] = matchType;
    });
    
    return map;
  }, [tutor.subjects, studentCoursesData]);

  // For backward compatibility - highlighted courses list
  const studentCourses = studentCoursesData.map(c => c.course_number);

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
            <TutorSubjectsSection subjects={tutor.subjects} matchByCourse={matchByCourse} />
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
