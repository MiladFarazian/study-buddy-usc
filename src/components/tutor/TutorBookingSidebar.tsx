
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, ArrowRightLeft } from "lucide-react";
import { Tutor } from "@/types/tutor";
import MessageButton from "@/components/messaging/MessageButton";
import { useState } from "react";
import { SchedulerModal } from "../scheduling/SchedulerModal";
import { BookSessionModal } from "../scheduling/BookSessionModal";
import { useAuthState } from "@/hooks/useAuthState";

interface TutorBookingSidebarProps {
  tutor: Tutor;
}

export const TutorBookingSidebar = ({ tutor }: TutorBookingSidebarProps) => {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const { user } = useAuthState();

  // Format hourly rate with two decimal places from tutor profile
  const formattedHourlyRate = tutor.hourlyRate ? `$${tutor.hourlyRate.toFixed(2)}` : "$25.00";

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Tutoring Session</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="font-bold text-2xl text-usc-cardinal">
              {formattedHourlyRate}/hour
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
            onClick={() => setShowBookingModal(true)}
          >
            Book a Session
          </Button>
          
          <MessageButton 
            recipient={tutor} 
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Use BookSessionModal for better user experience and error handling */}
      <BookSessionModal 
        isOpen={showBookingModal} 
        onClose={() => setShowBookingModal(false)}
        tutor={tutor}
      />
    </>
  );
};
