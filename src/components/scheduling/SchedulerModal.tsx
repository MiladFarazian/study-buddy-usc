
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling/types";
import { BookingStepSelector } from "./booking-modal/BookingStepSelector";
import { format } from "date-fns";
import { BookSessionModal } from "./BookSessionModal";

interface SchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutor: Tutor;
  initialDate?: Date;
  initialTime?: string;
}

export function SchedulerModal({ isOpen, onClose, tutor, initialDate, initialTime }: SchedulerModalProps) {
  // Since we already have BookSessionModal with better UX, let's use it directly
  return (
    <BookSessionModal
      isOpen={isOpen}
      onClose={onClose}
      tutor={tutor}
    />
  );
}
