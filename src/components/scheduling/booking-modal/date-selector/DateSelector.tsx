
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { BookingSlot } from "@/lib/scheduling";

interface DateSelectorProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  availableSlots: BookingSlot[];
}

export const DateSelector = ({ date, onDateChange, availableSlots }: DateSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label>1. Select Date</Label>
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
            onSelect={onDateChange}
            initialFocus
            className="p-3 pointer-events-auto"
            disabled={(date) => {
              // Disable dates that don't have available slots
              return !availableSlots.some(slot => {
                const slotDate = new Date(slot.day);
                return slotDate.toDateString() === date.toDateString() && slot.available;
              });
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
