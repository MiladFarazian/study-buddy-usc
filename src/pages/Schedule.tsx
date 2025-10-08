
import { useAuth } from "@/contexts/AuthContext";
import { SessionHeader } from "@/components/schedule/SessionHeader";
import { SessionManager } from "@/components/schedule/SessionManager";
import { TutorAvailabilitySection } from "@/components/schedule/TutorAvailabilitySection";
import { useViewMode } from "@/contexts/ViewModeContext";

const Schedule = () => {
  const { user } = useAuth();
  const { isTutorView } = useViewMode();
  
  return (
    <div className="py-6">
      <SessionHeader />
      
      {isTutorView && <TutorAvailabilitySection tutorId={user?.id} />}
      
      <SessionManager />
    </div>
  );
};

export default Schedule;
