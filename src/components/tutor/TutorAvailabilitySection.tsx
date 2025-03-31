
import { useEffect, useState } from "react";
import { TutorAvailabilityCard } from "../scheduling/TutorAvailabilityCard";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SimpleBookingWizard } from "../scheduling/SimpleBookingWizard";
import { Tutor } from "@/types/tutor";

interface TutorAvailabilitySectionProps {
  tutor: Tutor;
}

export const TutorAvailabilitySection = ({ tutor }: TutorAvailabilitySectionProps) => {
  const [showBookingModal, setShowBookingModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">Availability</h2>
          <p className="text-muted-foreground">
            Check when {tutor.firstName || tutor.name.split(' ')[0]} is available for tutoring
          </p>
        </div>
        <Button 
          onClick={() => setShowBookingModal(true)}
          className="mt-3 sm:mt-0 bg-usc-cardinal hover:bg-usc-cardinal-dark"
        >
          <Calendar className="mr-2 h-4 w-4" />
          Book a Session
        </Button>
      </div>

      <TutorAvailabilityCard tutorId={tutor.id} readOnly={true} />

      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book a Session with {tutor.name}</DialogTitle>
          </DialogHeader>
          <SimpleBookingWizard 
            tutor={tutor}
            onClose={() => setShowBookingModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
