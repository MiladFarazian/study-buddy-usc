
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingCalendar } from "../BookingCalendar";
import { BookingCalendarDrag } from "../BookingCalendarDrag";
import { BookingSlot } from "@/lib/scheduling";
import { Tutor } from "@/types/tutor";

interface BookingStepSelectorProps {
  tutor: Tutor;
  onSelectSlot: (slot: BookingSlot) => void;
  onClose: () => void;
}

export const BookingStepSelector = ({ 
  tutor, 
  onSelectSlot, 
  onClose 
}: BookingStepSelectorProps) => {
  return (
    <Tabs defaultValue="calendly" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="calendly">Calendly Style</TabsTrigger>
        <TabsTrigger value="classic">Classic View</TabsTrigger>
      </TabsList>
      
      <TabsContent value="calendly">
        <BookingCalendarDrag tutor={tutor} onSelectSlot={onSelectSlot} onClose={onClose} />
      </TabsContent>
      
      <TabsContent value="classic">
        <BookingCalendar tutor={tutor} onSelectSlot={onSelectSlot} />
      </TabsContent>
    </Tabs>
  );
};
