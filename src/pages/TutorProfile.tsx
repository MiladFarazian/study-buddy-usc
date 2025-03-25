
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTutor } from "@/hooks/useTutor";
import { ArrowLeft, Loader2 } from "lucide-react";
import { TutorProfileHeader } from "@/components/tutor/TutorProfileHeader";
import { TutorBioSection } from "@/components/tutor/TutorBioSection";
import { TutorEducationSection } from "@/components/tutor/TutorEducationSection";
import { TutorSubjectsSection } from "@/components/tutor/TutorSubjectsSection";
import { TutorReviewsSection } from "@/components/tutor/TutorReviewsSection";
import { TutorBookingSidebar } from "@/components/tutor/TutorBookingSidebar";
import { TutorAvailabilityCard } from "@/components/scheduling/TutorAvailabilityCard";

const TutorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { tutor, reviews, loading, refreshReviews } = useTutor(id || "");

  if (loading) {
    return (
      <div className="container py-8 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal" />
        <span className="ml-2">Loading tutor profile...</span>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="container py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-bold mb-4">Tutor Not Found</h1>
        <p className="text-muted-foreground mb-6">
          Sorry, we couldn't find the tutor profile you're looking for.
        </p>
        <Button asChild>
          <Link to="/tutors" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tutors
          </Link>
        </Button>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link to="/tutors" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tutors
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Profile Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <TutorProfileHeader 
                tutor={tutor} 
                reviewsCount={reviews.length} 
                getInitials={getInitials} 
              />
              <TutorBioSection bio={tutor.bio} />
              <TutorEducationSection field={tutor.field} graduationYear={tutor.graduationYear} />
              <TutorSubjectsSection subjects={tutor.subjects} />
            </CardContent>
          </Card>

          {/* Tutor Availability Section */}
          <div className="mt-8">
            <TutorAvailabilityCard tutorId={tutor.id} readOnly={true} />
          </div>

          {/* Reviews Section */}
          <TutorReviewsSection 
            reviews={reviews} 
            tutorId={tutor.id} 
            onReviewAdded={refreshReviews} 
          />
        </div>

        {/* Sidebar/Booking Section */}
        <div>
          <TutorBookingSidebar tutor={tutor} />
        </div>
      </div>
    </div>
  );
};

export default TutorProfile;
