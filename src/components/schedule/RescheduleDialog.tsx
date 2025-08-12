
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Session } from "@/types/session";
import { rescheduleSessionBooking } from "@/lib/scheduling/booking-utils";

interface RescheduleDialogProps {
  open: boolean;
  onClose: () => void;
  session: Session;
}

export function RescheduleDialog({ open, onClose, session }: RescheduleDialogProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // Initialize with existing times in local datetime-local format
  const toLocalInput = (iso?: string) =>
    iso ? new Date(iso).toISOString().slice(0, 16) : "";

  const [start, setStart] = useState<string>(toLocalInput(session.start_time));
  const [end, setEnd] = useState<string>(toLocalInput(session.end_time));

  const onConfirm = async () => {
    if (!start || !end) {
      toast({ title: "Missing time", description: "Select start and end times." });
      return;
    }
    setSubmitting(true);
    try {
      // Convert datetime-local (no timezone) to ISO with timezone
      const startIso = new Date(start).toISOString();
      const endIso = new Date(end).toISOString();

      const ok = await rescheduleSessionBooking(session.id, startIso, endIso);
      if (ok) {
        toast({ title: "Session rescheduled", description: "We sent confirmations to both parties." });
        onClose();
      } else {
        toast({ title: "Could not reschedule", description: "Please try again." });
      }
    } catch (e: any) {
      console.error("[RescheduleDialog] error", e);
      toast({ title: "Error", description: e?.message ?? "Unexpected error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule session</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm">New start</label>
            <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm">New end</label>
            <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={onConfirm} disabled={submitting}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
