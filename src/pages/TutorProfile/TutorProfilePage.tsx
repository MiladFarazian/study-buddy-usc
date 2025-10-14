
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useTutor } from "@/hooks/useTutor";
import { useState } from "react";
import { SchedulerModal } from "@/components/scheduling/SchedulerModal";
import { TutorProfileContent } from "./TutorProfileContent";
import { TutorProfileCTA } from "./TutorProfileCTA";

const TutorProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { tutor, reviews, loading, refreshReviews } = useTutor(id || "");
  const [showBookingModal, setShowBookingModal] = useState(false);

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

      <TutorProfileContent 
        tutor={tutor} 
        reviews={reviews} 
        refreshReviews={refreshReviews} 
        onBookSession={() => setShowBookingModal(true)}
      />
      
      <TutorProfileCTA 
        tutorName={tutor.name} 
        onBookSession={() => setShowBookingModal(true)} 
      />
      
      <SchedulerModal 
        isOpen={showBookingModal} 
        onClose={() => setShowBookingModal(false)}
        tutor={tutor}
      />
    </div>
  );
};

export default TutorProfilePage;
