
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface CancelSessionDialogProps {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  onConfirmCancel: () => void;
}

export const CancelSessionDialog = ({ 
  showDialog, 
  setShowDialog, 
  onConfirmCancel 
}: CancelSessionDialogProps) => {
  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Session</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this tutoring session? Cancellations within 24 hours may be subject to a fee.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setShowDialog(false)}>
            Keep Session
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirmCancel}
          >
            Yes, Cancel Session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
