
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AvailabilityCalendar } from "@/components/scheduling/AvailabilityCalendar";

export const TutorAvailabilityCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tutor Availability</CardTitle>
        <CardDescription>
          Set your weekly availability to let students book sessions with you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AvailabilityCalendar />
      </CardContent>
    </Card>
  );
};
