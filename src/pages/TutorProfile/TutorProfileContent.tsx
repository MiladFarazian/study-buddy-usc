
import { Tutor, Review } from "@/types/tutor";
import { TutorProfileHeader } from "@/components/tutor/TutorProfileHeader";
import { TutorProfileTabs } from "./TutorProfileTabs";
import { TutorBookingSidebar } from "@/components/tutor/TutorBookingSidebar";

interface TutorProfileContentProps {
  tutor: Tutor;
  reviews: Review[];
  refreshReviews: () => void;
  onBookSession: () => void;
}

export const TutorProfileContent = ({ 
  tutor, 
  reviews, 
  refreshReviews,
  onBookSession
}: TutorProfileContentProps) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <TutorBookingSidebar tutor={tutor} />
      </div>

      <div className="lg:col-span-2">
        <TutorProfileTabs 
          tutor={tutor} 
          reviews={reviews} 
          refreshReviews={refreshReviews}
          getInitials={getInitials}
          onBookSession={onBookSession}
        />
      </div>
    </div>
  );
};
