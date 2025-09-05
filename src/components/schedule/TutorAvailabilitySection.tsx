
import { TutorAvailabilityCard } from "@/components/scheduling/TutorAvailabilityCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface TutorAvailabilitySectionProps {
  tutorId?: string;
}

export const TutorAvailabilitySection = ({ tutorId }: TutorAvailabilitySectionProps) => {
  if (!tutorId) return null;
  
  return (
    <div className="mb-8">
      <Alert className="mb-4 bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          This is a read-only view of your availability. To edit your availability, go to <strong>Settings → Availability</strong>.
        </AlertDescription>
      </Alert>
      <TutorAvailabilityCard tutorId={tutorId} readOnly={true} />
    </div>
  );
};
