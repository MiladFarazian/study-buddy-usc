
import { TutorAvailabilityCard } from "@/components/scheduling/TutorAvailabilityCard";

interface TutorAvailabilitySectionProps {
  tutorId?: string;
}

export const TutorAvailabilitySection = ({ tutorId }: TutorAvailabilitySectionProps) => {
  if (!tutorId) return null;
  
  return (
    <div className="mb-8">
      <TutorAvailabilityCard tutorId={tutorId} readOnly={false} />
    </div>
  );
};
