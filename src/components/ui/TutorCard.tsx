
import { Tutor } from "@/types/tutor";
import { useIsMobile } from "@/hooks/use-mobile";
import TutorCardMobile from "./TutorCardMobile";
import TutorCardDesktop from "./TutorCardDesktop";

interface TutorCardProps {
  tutor: Tutor;
  highlightedCourses?: string[]; // Courses to highlight as matching
  mutualCourses?: string[]; // Courses where both you and tutor selected it
}

const TutorCard = ({ tutor, highlightedCourses, mutualCourses = [] }: TutorCardProps) => {
  const isMobile = useIsMobile();
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  // Render appropriate card based on screen size
  if (isMobile) {
    return <TutorCardMobile tutor={tutor} getInitials={getInitials} highlightedCourses={highlightedCourses} mutualCourses={mutualCourses} />;
  }

  return <TutorCardDesktop tutor={tutor} getInitials={getInitials} highlightedCourses={highlightedCourses} mutualCourses={mutualCourses} />;
};

export default TutorCard;
