
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingCalendar } from "../BookingCalendar";
import { BookingCalendarDrag } from "../BookingCalendarDrag";
import { BookingSlot } from "@/lib/scheduling";
import { Tutor } from "@/types/tutor";
import { useState } from "react";
import { format, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [timeSlots, setTimeSlots] = useState<{ start: string; end: string; }[]>([
    { start: "3:00 PM", end: "5:00 PM" },
    { start: "5:30 PM", end: "7:30 PM" },
  ]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  
  // Simplified UI based on the reference design
  return (
    <div className="space-y-6 py-2">
      <div className="space-y-2">
        <Label>Select Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "EEEE, MMMM do, yyyy") : <span>Select a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="space-y-2">
        <Label>Select Time</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedTime && "text-muted-foreground"
              )}
            >
              <Clock className="mr-2 h-4 w-4" />
              {selectedTime ? selectedTime : <span>Select a time slot</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <ScrollArea className="h-[200px] p-4">
              <div className="space-y-2">
                {timeSlots.map((slot, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left",
                      selectedTime === `${slot.start} - ${slot.end}` && "border-usc-cardinal bg-red-50"
                    )}
                    onClick={() => {
                      setSelectedTime(`${slot.start} - ${slot.end}`);
                      
                      if (date) {
                        // Create a booking slot object
                        const day = new Date(date);
                        const startHour = parseInt(slot.start.split(':')[0]);
                        const startMinute = parseInt(slot.start.split(':')[1].split(' ')[0]);
                        const isPM = slot.start.includes('PM');
                        
                        const adjustedHour = isPM && startHour !== 12 ? startHour + 12 : startHour;
                        
                        const endHour = parseInt(slot.end.split(':')[0]);
                        const endMinute = parseInt(slot.end.split(':')[1].split(' ')[0]);
                        const isEndPM = slot.end.includes('PM');
                        
                        const adjustedEndHour = isEndPM && endHour !== 12 ? endHour + 12 : endHour;
                        
                        const bookingSlot: BookingSlot = {
                          tutorId: tutor.id,
                          day,
                          start: `${adjustedHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`,
                          end: `${adjustedEndHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`,
                          available: true
                        };
                        
                        onSelectSlot(bookingSlot);
                      }
                    }}
                  >
                    {slot.start} - {slot.end}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="space-y-2">
        <Label>Your Email</Label>
        <Input 
          type="email" 
          placeholder="your@email.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">A confirmation will be sent to this email address</p>
      </div>
    </div>
  );
};
