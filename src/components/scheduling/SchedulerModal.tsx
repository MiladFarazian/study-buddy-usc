import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tab, Tabs, TabsList, TabsPanel, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling/types";
import { BookingStepSelector } from "./booking-modal/BookingStepSelector";
import { format } from "date-fns";

// Updated the component where SchedulerModal is defined to use the correct BookingStepSelector props
// Only showing the relevant part where the error occurs

// In your JSX where BookingStepSelector is used, remove the initialDate and initialTime props:
export function UpdatableSchedulerModal({ /* your props */ }) {
  // ... keep existing code
  
  return (
    // ... keep existing code
    <BookingStepSelector 
      tutor={tutor} 
      onSelectSlot={handleSlotSelect} 
      onClose={handleClose} 
      // initialDate and initialTime props removed as they're not defined in BookingStepSelectorProps
    />
    // ... keep existing code
  );
}
