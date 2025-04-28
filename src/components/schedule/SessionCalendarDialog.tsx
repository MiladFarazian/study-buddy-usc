
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarIntegration } from "../scheduling/calendar-integration/CalendarIntegration";
import { Session } from "@/types/session";

interface SessionCalendarDialogProps {
  session: Session;
  open: boolean;
  onClose: () => void;
}

export function SessionCalendarDialog({ session, open, onClose }: SessionCalendarDialogProps) {
  const sessionDate = new Date(session.start_time);
  const startTime = sessionDate.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  const duration = Math.round((new Date(session.end_time).getTime() - sessionDate.getTime()) / (1000 * 60));

  const tutor = {
    id: session.tutor_id,
    name: session.tutor?.first_name && session.tutor?.last_name 
      ? `${session.tutor.first_name} ${session.tutor.last_name}`
      : "Your Tutor",
    subjects: session.course ? [{ name: session.course.course_number }] : []
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Calendar</DialogTitle>
        </DialogHeader>
        <CalendarIntegration
          tutor={tutor}
          sessionDate={sessionDate}
          sessionDuration={duration}
          sessionStartTime={startTime}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
