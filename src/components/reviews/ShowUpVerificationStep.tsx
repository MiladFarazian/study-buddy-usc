import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Session } from "@/types/session";
import { Tutor } from "@/types/tutor";
import { CheckCircle, XCircle, Clock, User, Calendar } from "lucide-react";
import { format } from "date-fns";

interface ShowUpVerificationStepProps {
  tutor: Tutor;
  session: Session;
  onResponse: (showedUp: boolean) => void;
}

export function ShowUpVerificationStep({
  tutor,
  session,
  onResponse
}: ShowUpVerificationStepProps) {
  return (
    <div className="space-y-6">
      {/* Session details card */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-usc-cardinal" />
              <span className="font-medium">Tutor:</span>
              <span>{tutor.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-usc-cardinal" />
              <span className="font-medium">Date:</span>
              <span>{format(new Date(session.start_time), "MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-usc-cardinal" />
              <span className="font-medium">Time:</span>
              <span>
                {format(new Date(session.start_time), "h:mm a")} - {format(new Date(session.end_time), "h:mm a")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main verification question */}
      <div className="text-center space-y-6">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground">
            Did your tutor show up for the scheduled session?
          </h2>
          <p className="text-muted-foreground text-lg">
            This helps us process your payment and ensure quality tutoring services.
          </p>
        </div>

        {/* Response buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
          <Button
            onClick={() => onResponse(true)}
            size="lg"
            className="flex-1 h-16 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="h-6 w-6 mr-3" />
            Yes, tutor showed up
          </Button>
          
          <Button
            onClick={() => onResponse(false)}
            variant="destructive"
            size="lg"
            className="flex-1 h-16 text-lg font-semibold"
          >
            <XCircle className="h-6 w-6 mr-3" />
            No, tutor did not show up
          </Button>
        </div>

        {/* Additional context */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm text-blue-800 font-medium mb-1">
                Why we ask this question:
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Ensures fair payment processing</li>
                <li>• Helps maintain tutor accountability</li>
                <li>• Allows us to address any issues promptly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}