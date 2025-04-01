
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { Tutor } from "@/types/tutor";
import { Link } from "react-router-dom";

interface TutorAvailabilitySectionProps {
  tutor: Tutor;
}

export const TutorAvailabilitySection = ({ tutor }: TutorAvailabilitySectionProps) => {
  // Mock availability data - in a real app, this would come from the database
  const availabilityByDay = {
    monday: "9:00 AM - 5:00 PM",
    tuesday: "9:00 AM - 5:00 PM",
    wednesday: "9:00 AM - 5:00 PM",
    thursday: "9:00 AM - 5:00 PM",
    friday: "9:00 AM - 5:00 PM",
    saturday: "Unavailable",
    sunday: "Unavailable"
  };

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
          className="mt-3 sm:mt-0 bg-usc-cardinal hover:bg-usc-cardinal-dark"
          asChild
        >
          <Link to={`/tutors/${tutor.id}/schedule`}>
            <Calendar className="mr-2 h-4 w-4" />
            Book a Session
          </Link>
        </Button>
      </div>

      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(availabilityByDay).map(([day, hours]) => (
            <div key={day} className="flex justify-between border-b pb-2 last:border-b-0 last:pb-0">
              <div className="font-medium capitalize">{day}</div>
              <div className={hours === "Unavailable" ? "text-gray-400" : ""}>
                {hours}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
