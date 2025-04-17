
import { DateSelector } from "@/lib/scheduling/ui/DateSelector";

interface DateStepProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date) => void;
  availableDates: Date[];
}

export function DateStep({ selectedDate, onDateChange, availableDates }: DateStepProps) {
  return (
    <DateSelector 
      selectedDate={selectedDate} 
      onDateChange={onDateChange}
      availableDates={availableDates}
    />
  );
}
