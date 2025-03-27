
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BookingSummaryProps {
  selectedDate: Date;
  selectedTime: string;
  durationMinutes: number;
  cost: number;
  notes: string;
  onNotesChange: (notes: string) => void;
}

export function BookingSummary({ 
  selectedDate,
  selectedTime,
  durationMinutes,
  cost,
  notes,
  onNotesChange
}: BookingSummaryProps) {
  // Format the time for display
  const formatTimeDisplay = (time24: string): string => {
    try {
      const [hours, minutes] = time24.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes);
      return format(date, 'h:mm a');
    } catch (e) {
      return time24;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Complete Your Booking</h2>
      
      <div className="bg-gray-50 p-6 rounded-md">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Selected Time:</h3>
        <p className="text-xl font-medium">
          {format(selectedDate, 'MMMM d, yyyy')} at {formatTimeDisplay(selectedTime)}
        </p>
      </div>
      
      <div>
        <Label htmlFor="duration">Session Duration</Label>
        <Select defaultValue={`${durationMinutes}`} disabled>
          <SelectTrigger id="duration" className="mt-1">
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={`${durationMinutes}`}>
              {durationMinutes} minutes (${cost})
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Any specific topics you'd like to cover?"
          className="mt-1 resize-none h-32"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
        />
      </div>
      
      <Separator />
      
      <div className="flex justify-between items-center">
        <div>
          <p className="text-muted-foreground">Session duration</p>
          <p className="text-muted-foreground">Total</p>
        </div>
        <div className="text-right">
          <p>{durationMinutes} minutes</p>
          <p className="font-bold text-lg">${cost}</p>
        </div>
      </div>
    </div>
  );
}
