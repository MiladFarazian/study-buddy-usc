
import { Tutor } from "@/types/tutor";
import { useIsMobile } from "@/hooks/use-mobile";
import TutorCardMobile from "./TutorCardMobile";
import TutorCardDesktop from "./TutorCardDesktop";
import { MatchResult } from "@/lib/instructor-matching-utils";

interface TutorCardProps {
  tutor: Tutor;
  highlightedCourses?: string[]; // Courses to highlight as matching
  matchResult?: MatchResult; // Match result for this tutor
}

const TutorCard = ({ tutor, highlightedCourses, matchResult }: TutorCardProps) => {
  const isMobile = useIsMobile();
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  // Render appropriate card based on screen size
  if (isMobile) {
    return <TutorCardMobile tutor={tutor} getInitials={getInitials} highlightedCourses={highlightedCourses} matchResult={matchResult} />;
  }

  return <TutorCardDesktop tutor={tutor} getInitials={getInitials} highlightedCourses={highlightedCourses} matchResult={matchResult} />;
};

export default TutorCard;
