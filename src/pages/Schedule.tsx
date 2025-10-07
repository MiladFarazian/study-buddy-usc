
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRedirect } from "@/hooks/useAdminRedirect";
import { SessionHeader } from "@/components/schedule/SessionHeader";
import { SessionManager } from "@/components/schedule/SessionManager";
import { TutorAvailabilitySection } from "@/components/schedule/TutorAvailabilitySection";

const Schedule = () => {
  const { user, isTutor } = useAuth();
  const { loading: adminLoading } = useAdminRedirect();
  
  if (adminLoading) return null;
  
  return (
    <div className="py-6">
      <SessionHeader />
      
      {isTutor && <TutorAvailabilitySection tutorId={user?.id} />}
      
      <SessionManager />
    </div>
  );
};

export default Schedule;
