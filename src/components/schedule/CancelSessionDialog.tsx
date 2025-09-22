
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const cancellationReasons = [
  { value: "schedule_conflict", label: "Schedule conflict" },
  { value: "emergency", label: "Emergency" },
  { value: "no_longer_needed", label: "No longer needed" },
  { value: "other", label: "Other" }
];

interface CancelSessionDialogProps {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  onConfirmCancel: (reason: string) => void;
}

export const CancelSessionDialog = ({ 
  showDialog, 
  setShowDialog, 
  onConfirmCancel 
}: CancelSessionDialogProps) => {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = () => {
    setSelectedReason("");
    setShowDialog(false);
  };

  const handleConfirm = async () => {
    if (!selectedReason) return;
    
    setIsLoading(true);
    try {
      await onConfirmCancel(selectedReason);
      setSelectedReason("");
      setShowDialog(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel Session</DialogTitle>
          <DialogDescription>
            Please select a reason for cancellation. Cancellations within 24 hours may be subject to a fee.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Cancellation Reason</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {cancellationReasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            <p className="font-medium mb-1">Refund Policy:</p>
            <p>Sessions cancelled more than 24 hours in advance receive a full refund. Later cancellations may incur fees.</p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Keep Session
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={!selectedReason || isLoading}
          >
            {isLoading ? "Cancelling..." : "Confirm Cancellation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
