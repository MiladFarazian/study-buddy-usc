
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, ArrowRightLeft } from "lucide-react";
import { Tutor } from "@/types/tutor";
import MessageButton from "@/components/messaging/MessageButton";
import { useState } from "react";
import { BookSessionModal } from "../scheduling/BookSessionModal";
import { AuthRequiredDialog } from "../scheduling/booking-modal/AuthRequiredDialog";
import { useAuthState } from "@/hooks/useAuthState";
import { useLocation } from "react-router-dom";
import { SchedulingProvider } from "@/contexts/SchedulingContext";

interface TutorBookingSidebarProps {
  tutor: Tutor;
}

export const TutorBookingSidebar = ({ tutor }: TutorBookingSidebarProps) => {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { user } = useAuthState();
  const location = useLocation();

  const handleBookSession = () => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    setShowBookingModal(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Tutoring Session</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="font-bold text-2xl text-usc-cardinal">
              ${tutor.hourlyRate ? tutor.hourlyRate.toFixed(2) : "25.00"}/hour
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <p className="font-medium">Choose from available dates</p>
                <p className="text-sm text-muted-foreground">Based on tutor's schedule</p>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <p className="font-medium">Select your session length</p>
                <p className="text-sm text-muted-foreground">30 min, 1 hour, or 1.5 hours</p>
              </div>
            </div>
            <div className="flex items-center">
              <ArrowRightLeft className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <p className="font-medium">Flexible time slots</p>
                <p className="text-sm text-muted-foreground">Pick any time within available hours</p>
              </div>
            </div>
          </div>

          <Button 
            className="w-full bg-usc-cardinal hover:bg-usc-cardinal-dark text-white mb-3"
            onClick={handleBookSession}
          >
            Book a Session
          </Button>
          
          <MessageButton 
            recipient={tutor} 
            className="w-full"
          />
        </CardContent>
      </Card>

      <AuthRequiredDialog 
        isOpen={showAuthDialog} 
        onClose={() => setShowAuthDialog(false)}
        returnPath={location.pathname}
      />

      {user && (
        <SchedulingProvider>
          <BookSessionModal 
            isOpen={showBookingModal} 
            onClose={() => setShowBookingModal(false)}
            tutor={tutor}
          />
        </SchedulingProvider>
      )}
    </>
  );
}
