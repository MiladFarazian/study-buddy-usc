
import { Tutor } from "@/types/tutor";
import { useIsMobile } from "@/hooks/use-mobile";
import TutorCardMobile from "./TutorCardMobile";
import TutorCardDesktop from "./TutorCardDesktop";

interface TutorCardProps {
  tutor: Tutor;
}

const TutorCard = ({ tutor }: TutorCardProps) => {
  const isMobile = useIsMobile();
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  // Render appropriate card based on screen size
  if (isMobile) {
    return <TutorCardMobile tutor={tutor} getInitials={getInitials} />;
  }

  return <TutorCardDesktop tutor={tutor} getInitials={getInitials} />;
};

export default TutorCard;
