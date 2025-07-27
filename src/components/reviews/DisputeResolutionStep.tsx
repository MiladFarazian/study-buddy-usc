import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Session } from "@/types/session";
import { Tutor } from "@/types/tutor";
import { AlertTriangle, MessageSquare, Clock, RefreshCw, Phone } from "lucide-react";
import { toast } from "sonner";

interface DisputeResolutionStepProps {
  session: Session;
  tutor: Tutor;
  onClose: () => void;
}

export function DisputeResolutionStep({
  session,
  tutor,
  onClose
}: DisputeResolutionStepProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const noShowReasons = [
    {
      id: "no_communication",
      title: "Tutor didn't communicate at all",
      description: "No message, call, or notification about absence"
    },
    {
      id: "late_cancellation",
      title: "Last-minute cancellation (< 2 hours)",
      description: "Tutor cancelled too close to session time"
    },
    {
      id: "technical_issues",
      title: "Technical problems (virtual sessions)",
      description: "Zoom/connection issues that prevented the session"
    },
    {
      id: "emergency",
      title: "Tutor had an emergency",
      description: "Unexpected situation prevented attendance"
    },
    {
      id: "other",
      title: "Other reason",
      description: "Please provide details below"
    }
  ];

  const handleSubmitDispute = async () => {
    if (!selectedReason) {
      toast.error("Please select a reason for the no-show");
      return;
    }

    if (selectedReason === "other" && !additionalDetails.trim()) {
      toast.error("Please provide additional details");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Here you would typically submit the dispute to your backend
      // For now, we'll just simulate the submission
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Dispute submitted successfully. Our team will review this within 24 hours.");
      onClose();
    } catch (error) {
      toast.error("Failed to submit dispute. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert header */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            <div>
              <h3 className="font-semibold text-orange-800">No-Show Reported</h3>
              <p className="text-sm text-orange-700">
                We're sorry this happened. Let's resolve this issue quickly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Immediate actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Immediate Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              <div className="text-center">
                <div className="font-medium">Reschedule Session</div>
                <div className="text-sm text-muted-foreground">Book a new time slot</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Phone className="h-5 w-5" />
              <div className="text-center">
                <div className="font-medium">Contact Support</div>
                <div className="text-sm text-muted-foreground">Get immediate help</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reason selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            What happened?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {noShowReasons.map((reason) => (
              <div
                key={reason.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedReason === reason.id
                    ? "border-usc-cardinal bg-red-50"
                    : "border-border hover:border-muted-foreground"
                }`}
                onClick={() => setSelectedReason(reason.id)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 mt-0.5 ${
                      selectedReason === reason.id
                        ? "border-usc-cardinal bg-usc-cardinal"
                        : "border-muted-foreground"
                    }`}
                  />
                  <div>
                    <div className="font-medium">{reason.title}</div>
                    <div className="text-sm text-muted-foreground">{reason.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Additional details */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Additional details {selectedReason === "other" && <span className="text-red-500">*</span>}
            </label>
            <Textarea
              placeholder="Please provide any additional information that might help us understand what happened..."
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* What happens next */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-semibold text-blue-800 mb-2">What happens next?</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Your payment will be automatically refunded within 24 hours</li>
            <li>• Our team will review the situation with the tutor</li>
            <li>• You'll receive priority booking for future sessions</li>
            <li>• We'll help you reschedule with the same or different tutor</li>
          </ul>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmitDispute}
          disabled={!selectedReason || isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? "Submitting..." : "Submit Report"}
        </Button>
      </div>
    </div>
  );
}