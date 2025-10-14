
import { useAuth } from "@/contexts/AuthContext";
import { SessionHeader } from "@/components/schedule/SessionHeader";
import { SessionManager } from "@/components/schedule/SessionManager";
import { TutorAvailabilitySection } from "@/components/schedule/TutorAvailabilitySection";

const Schedule = () => {
  const { user, isTutor } = useAuth();
  
  return (
    <div className="py-6">
      <SessionHeader />
      
      {isTutor && <TutorAvailabilitySection tutorId={user?.id} />}
      
      <SessionManager />
    </div>
  );
};

export default Schedule;
